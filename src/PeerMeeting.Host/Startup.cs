// Copyright 2021 klabukov.
// SPDX-License-Identifier: GPL-3.0-only

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.SpaServices;
using PeerMeeting.Host.Configuration;
using PeerMeeting.Host.Hubs;
using VueCliMiddleware;
using PeerMeeting.Host.Infrastructure;
using Prometheus.HttpMetrics;
using System.Collections.Generic;
using Prometheus;
using System;

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
                signalRBuilder.AddStackExchangeRedis(redisConfiguration.ConnectionString);
                
            services.AddControllers();
            services.AddMvc();
            services.AddSpaStaticFiles(c => c.RootPath = "ClientApp/dist");
            services.AddSingleton<WebRtcHub>();
            services.AddSingleton<ChatHub>();
            services.AddSingleton(Configuration.GetMetricsConfiguration());
            services.AddHostedService<MetricsService>();
            services.AddResponseCompression(options =>
            {
                options.Providers.Add<BrotliCompressionProvider>();
                options.Providers.Add<GzipCompressionProvider>();
                options.EnableForHttps = true;
            });
        }

        /// <summary>
        /// Configure app pipeline
        /// </summary>
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, MetricsConfiguration metricsConfiguration)
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
