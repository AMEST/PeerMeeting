using Microsoft.Extensions.Configuration;

namespace PeerMeeting.Host.Configuration
{
    /// <summary>
    /// Extensions methods for simple getting mapped configuration from appsettings
    /// </summary>
    public static class ConfigurationExtensions
    {
        /// <summary>
        /// Get Redis Configuration 
        /// </summary>
        public static RedisConfiguration GetRedisConfiguration(this IConfiguration configuration)
        {
            var redisConfiguration = new RedisConfiguration();
            configuration.GetSection("Redis").Bind(redisConfiguration);
            return redisConfiguration;
        }
    }
}