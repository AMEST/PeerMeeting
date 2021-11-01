using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Http;

namespace PeerMeeting.Host.Middlewares
{
    public class CsrfMiddleware : IMiddleware
    {
        private readonly IAntiforgery _antiforgery;

        public CsrfMiddleware(IAntiforgery antiforgery)
        {
            _antiforgery = antiforgery;
        }

        public Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            var path = context.Request.Path.Value;
            if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase)
                || path.StartsWith("/ws/", StringComparison.OrdinalIgnoreCase)) return next(context);

            var tokens = _antiforgery.GetAndStoreTokens(context);
            context.Response.Cookies.Append("CSRF-TOKEN", tokens.RequestToken,
                new CookieOptions() { HttpOnly = false });

            return next(context);
        }
    }
}