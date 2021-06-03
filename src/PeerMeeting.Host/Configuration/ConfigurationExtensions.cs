using Microsoft.Extensions.Configuration;

namespace PeerMeeting.Host.Configuration
{
    public static class ConfigurationExtensions
    {
        public static RedisConfiguration GetRedisConfiguration(this IConfiguration configuration)
        {
            var redisConfiguration = new RedisConfiguration();
            configuration.GetSection("Redis").Bind(redisConfiguration);
            return redisConfiguration;
        }
    }
}