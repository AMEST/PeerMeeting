// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace PeerMeeting.Host
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Microsoft.Extensions.Hosting.Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}
