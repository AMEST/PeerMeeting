using Microsoft.AspNetCore.Builder;

namespace PeerMeeting.Host.Middlewares
{
    public static class ApplicationBuilderExtensions
    {
        public static IApplicationBuilder UseCsrf(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<CsrfMiddleware>();
        }
    }
}