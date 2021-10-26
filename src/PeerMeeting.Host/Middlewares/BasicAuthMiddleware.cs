using System;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using PeerMeeting.Host.Configuration;

namespace PeerMeeting.Host.Middlewares
{
    internal class BasicAuthMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly MetricsConfiguration _metricsConfiguration;

        public BasicAuthMiddleware(RequestDelegate next, MetricsConfiguration metricsConfiguration)
        {
            _next = next;
            _metricsConfiguration = metricsConfiguration;
        }

        public async Task Invoke(HttpContext context)
        {
            string authHeader = context.Request.Headers["Authorization"];
            if (authHeader != null && authHeader.StartsWith("Basic "))
            {
                // Get the encoded username and password
                var encodedUsernamePassword = authHeader.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries)[1]?.Trim();

                // Decode from Base64 to string
                var decodedUsernamePassword = Encoding.UTF8.GetString(Convert.FromBase64String(encodedUsernamePassword));

                // Split username and password
                var username = decodedUsernamePassword.Split(':', 2)[0];
                var password = decodedUsernamePassword.Split(':', 2)[1];

                // Check if login is correct
                if (IsAuthorized(username, password))
                {
                    await _next.Invoke(context);
                    return;
                }
            }

            // Return authentication type (causes browser to show login dialog)
            context.Response.Headers["WWW-Authenticate"] = "Basic";
            context.Response.Headers["WWW-Authenticate"] += " realm=\"Metrics endpoint\"";

            // Return unauthorized
            context.Response.StatusCode = (int) HttpStatusCode.Unauthorized;
        }

        public bool IsAuthorized(string username, string password)
        {
            // Check that username and password are correct
            return username.Equals(_metricsConfiguration.Username, StringComparison.InvariantCultureIgnoreCase)
                    && _metricsConfiguration.Password.Equals(password);
        }
    }
}