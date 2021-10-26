using System;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using PeerMeeting.Host.Configuration;
using PeerMeeting.Host.Middlewares;
using Prometheus;

namespace PeerMeeting.Host.Infrastructure
{
    public static class ApplicationBuilderExtensions
    {
        public static IApplicationBuilder UseMetrics(this IApplicationBuilder builder, MetricsConfiguration configuration)
        {
            if(!configuration.Enabled)
                return builder;

            return builder.Map(configuration.Endpoint, metricsApp =>
            {
                if (configuration.BasicAuth)
                    metricsApp.UseMiddleware<BasicAuthMiddleware>(configuration);
                metricsApp.UseMetricServer(string.Empty);
            })
            .Use(async (context, next) =>
            {
                if (!context.IsStaticFiles())
                {
                    var routeData = context.GetRouteData();
                    if (string.IsNullOrEmpty(routeData.Values["controller"] as string))
                        context.GetRouteData().Values.Add("controller", context.GetCustomControllerName(configuration));
                    if (string.IsNullOrEmpty(routeData.Values["action"] as string))
                        context.GetRouteData().Values.Add("action", context.Request.Path.Value);
                }
                await next();
            })
            .UseHttpMetrics(); ;
        }

        private static string GetCustomControllerName(this HttpContext context, MetricsConfiguration configuration)
        {
            var path = context.Request.Path.Value;
            if (path.StartsWith("/ws/"))
                return "signalR";

            if (path.StartsWith(configuration.Endpoint))
                return "prometheus";

            return "spa";
        }

        private static bool IsStaticFiles(this HttpContext context)
        {
            var path = context.Request.Path.Value;
            var method = context.Request.Method;
            var pathExtension = Path.GetExtension(path);
            return method.Equals("get", StringComparison.OrdinalIgnoreCase)
                    && (!string.IsNullOrEmpty(pathExtension)
                    || path.StartsWith("/sockjs-node"));
        }
    }
}