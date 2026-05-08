// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only

using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.SpaServices;
using PeerMeeting.Domain;
using PeerMeeting.Host.Configuration;
using PeerMeeting.Host.Hubs;
using PeerMeeting.Host.Middlewares;
using PeerMeeting.Host.Services;
using VueCliMiddleware;
using PeerMeeting.Host.Infrastructure;
using Microsoft.AspNetCore.DataProtection;
using StackExchange.Redis;
using Microsoft.AspNetCore.Http.Connections;
using Serilog;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using PeerMeeting.Host.HealthChecks;
using System.Threading.Tasks;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
builder.Host.UseSerilog((context, services, configuration) => 
{
    configuration.ReadFrom.Configuration(context.Configuration);
    AppDomain.CurrentDomain.UnhandledException += (sender, eventArgs) =>
    {
        var exception = eventArgs.ExceptionObject as Exception;
        Log.Logger.ForContext<Program>().Error(exception, "Unhandled Exception");
    };
    TaskScheduler.UnobservedTaskException += (sender, eventArgs) =>
    {
        Log.Logger.ForContext<Program>().Error(eventArgs.Exception, "Unobserved Task Exception");
    };
});

// Add services to the container.
builder.Services.AddSignalR(o =>
{
    o.EnableDetailedErrors = true;
    o.MaximumReceiveMessageSize = 256 * 1024; //256 KB
});

// Configure Redis if enabled
var redisConfiguration = builder.Configuration.GetRedisConfiguration();
builder.Services.AddSingleton<RedisConfiguration>(redisConfiguration);
if (redisConfiguration.Enabled && !string.IsNullOrEmpty(redisConfiguration.ConnectionString))
{
    builder.Services.AddSignalR().AddStackExchangeRedis(redisConfiguration.ConnectionString);
    var redis = ConnectionMultiplexer.Connect(redisConfiguration.ConnectionString);
    builder.Services.AddDataProtection()
        .PersistKeysToStackExchangeRedis(
            redis, 
            "peermeeting.DataProtection-Keys");
}

builder.Services.AddControllers();
builder.Services.AddMvc();
builder.Services.AddSpaStaticFiles(c => c.RootPath = "ClientApp/dist");
builder.Services.AddSingleton<WebRtcHub>();
builder.Services.AddSingleton<ChatHub>();
builder.Services.AddSingleton(builder.Configuration.GetMetricsConfiguration());
builder.Services.AddHostedService<MetricsService>();
builder.Services.AddSingleton<ICredentialsService, HmacCredentialsService>();
builder.Services.AddSingleton(builder.Configuration.GetCoturnConfiguration());
builder.Services.AddSingleton(builder.Configuration.GetPwaConfiguration());
builder.Services.AddScoped<CsrfMiddleware>();
builder.Services.AddResponseCompression(options =>
{
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.EnableForHttps = true;
});
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.SuppressXFrameOptionsHeader = false;
});

// Add health checks
var coturnConfiguration = builder.Configuration.GetCoturnConfiguration();
builder.Services.AddHealthChecks()
    .AddCheck<RedisHealthCheck>("Redis", HealthStatus.Unhealthy)
    .AddCheck<CoturnHealthCheck>("Coturn", HealthStatus.Degraded);

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseResponseCompression();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Error");
}

app.UseRouting();

app.UseMetrics(builder.Configuration.GetMetricsConfiguration());

app.UseCsrf();

app.UseSpaStaticFiles();

app.UseAuthentication();

app.UseAuthorization();

app.UseEndpoints(endpoints =>
{
    endpoints.MapHub<WebRtcHub>("/ws/webrtc", o =>
    {
        // zero for unlimited
        o.TransportMaxBufferSize = 0;
        o.Transports = HttpTransportType.WebSockets;
    });
    endpoints.MapHub<ChatHub>("/ws/chat", o =>
    {
        // zero for unlimited
        o.TransportMaxBufferSize = 0;
        o.Transports = HttpTransportType.WebSockets;
    });
    endpoints.MapControllers();
    if (app.Environment.IsDevelopment())
    {
        endpoints.MapToVueCliProxy(
            "{*path}",
            new SpaOptions { SourcePath = "ClientApp" },
            npmScript: "serve",
            regex: "Compiled successfully",
            forceKill: true
        );
    }
});
app.MapHealthChecks("/api/health");
app.UseSpa(spa =>
{
    spa.Options.SourcePath = "ClientApp";
});

app.Run();