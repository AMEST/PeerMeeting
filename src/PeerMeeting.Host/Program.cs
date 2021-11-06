// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only

using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Serilog;

namespace PeerMeeting.Host
{
    internal class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Microsoft.Extensions.Hosting.Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>()
                        .UseSerilog(ConfigureSerilog)
                        .UseSentry();
                });

        public static void ConfigureSerilog(WebHostBuilderContext ctx, LoggerConfiguration config)
        {
            config.ReadFrom.Configuration(ctx.Configuration);
            AppDomain.CurrentDomain.UnhandledException += (sender, eventArgs) =>
            {
                var exception = eventArgs.ExceptionObject as Exception;
                Log.Logger.ForContext<Program>().Error(exception, "Unhandled Exception");
            };
            TaskScheduler.UnobservedTaskException += (sender, eventArgs) =>
            {
                Log.Logger.ForContext<Program>().Error(eventArgs.Exception, "Unobserved Task Exception");
            };
        }

    }
}
