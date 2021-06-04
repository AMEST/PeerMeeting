// Copyright 2021 klabukov.
// SPDX-License-Identifier: GPL-3.0-only

using System;
using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.SpaServices;
using PeerMeeting.Host.Configuration;
using PeerMeeting.Host.Hubs;
using StackExchange.Redis;
using VueCliMiddleware;

namespace PeerMeeting.Host
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

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
            services.AddResponseCompression(options =>
            {
                options.Providers.Add<BrotliCompressionProvider>();
                options.Providers.Add<GzipCompressionProvider>();
                options.EnableForHttps = true;
            });
        }

        // This method gets called by the runtime. Use this method to add services to the container.

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
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

            app.UseSpaStaticFiles();

            app.UseAuthentication();

            app.UseRouting();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapHub<WebRtcHub>("/ws/webrtc", o =>
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
