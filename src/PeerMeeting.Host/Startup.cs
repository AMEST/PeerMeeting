// Copyright 2021 klabukov.
// SPDX-License-Identifier: GPL-3.0-only

using System;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
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
using System.Collections.Generic;
using Prometheus;
using Microsoft.AspNetCore.DataProtection;
using StackExchange.Redis;

namespace PeerMeeting.Host
{
    /// <summary>
    /// Startup class
    /// </summary>
    public class Startup
    {
        /// <summary>
        /// Constructor
        /// </summary>
        public Startup(IConfiguration configuration, Microsoft.Extensions.Hosting.IHostingEnvironment environment)
        {
            Configuration = configuration;
            Metrics.DefaultRegistry.SetStaticLabels(new Dictionary<string, string>
            {
                { "environment", environment.EnvironmentName },
                { "hostname", Environment.MachineName },
                { "application", "PeerMeeting" }
            });
        }

        /// <summary>
        /// App configuration
        /// </summary>
        public IConfiguration Configuration { get; }

        /// <summary>
        /// Register dependencies
        /// </summary>
        public void ConfigureServices(IServiceCollection services)
        {
            var redisConfiguration = Configuration.GetRedisConfiguration();
            var signalRBuilder = services.AddSignalR(o =>
            {
                o.EnableDetailedErrors = true;
                o.MaximumReceiveMessageSize = 256 * 1024; //256 KB
            });
            if (redisConfiguration.Enabled && !string.IsNullOrEmpty(redisConfiguration.ConnectionString))
            {
                signalRBuilder.AddStackExchangeRedis(redisConfiguration.ConnectionString);
                services.AddDataProtection()
                    .PersistKeysToStackExchangeRedis(
                        ConnectionMultiplexer.Connect(redisConfiguration.ConnectionString), 
                        "DataProtection-Keys");
            }

            services.AddControllers();
            services.AddMvc();
            services.AddSpaStaticFiles(c => c.RootPath = "ClientApp/dist");
            services.AddSingleton<WebRtcHub>();
            services.AddSingleton<ChatHub>();
            services.AddSingleton(Configuration.GetMetricsConfiguration());
            services.AddHostedService<MetricsService>();
            services.AddSingleton<ICredentialsService, HmacCredentialsService>();
            services.AddSingleton(Configuration.GetCoturnConfiguration());
            services.AddScoped<CsrfMiddleware>();
            services.AddResponseCompression(options =>
            {
                options.Providers.Add<BrotliCompressionProvider>();
                options.Providers.Add<GzipCompressionProvider>();
                options.EnableForHttps = true;
            });
            services.AddAntiforgery(options =>
            {
                options.HeaderName = "X-CSRF-TOKEN";
                options.SuppressXFrameOptionsHeader = false;
            });
        }

        /// <summary>
        /// Configure app pipeline
        /// </summary>
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, MetricsConfiguration metricsConfiguration, IAntiforgery antiforgery)
        {
            app.UseResponseCompression();
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
            }
            app.UseRouting();

            app.UseMetrics(metricsConfiguration);

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
                });
                endpoints.MapHub<ChatHub>("/ws/chat", o =>
                {
                    // zero for unlimited
                    o.TransportMaxBufferSize = 0;
                });
                endpoints.MapControllers();
                if (env.IsDevelopment())
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

            app.UseSpa(spa =>
            {
                spa.Options.SourcePath = "ClientApp";
            });
        }
    }
}
