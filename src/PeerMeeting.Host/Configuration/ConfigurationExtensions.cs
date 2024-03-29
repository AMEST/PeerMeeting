﻿using System;
using Microsoft.Extensions.Configuration;

namespace PeerMeeting.Host.Configuration
{
    /// <summary>
    /// Extensions methods for simple getting mapped configuration from appsettings
    /// </summary>
    public static class ConfigurationExtensions
    {
        /// <summary>
        /// Get Redis configuration 
        /// </summary>
        public static RedisConfiguration GetRedisConfiguration(this IConfiguration configuration)
        {
            var redisConfiguration = new RedisConfiguration();
            configuration.GetSection("Redis").Bind(redisConfiguration);
            return redisConfiguration;
        }

        /// <summary>
        /// Get metrics configuration 
        /// </summary>
        public static MetricsConfiguration GetMetricsConfiguration(this IConfiguration configuration)
        {
            var metricsConfiguration = new MetricsConfiguration();
            configuration.GetSection("Metrics").Bind(metricsConfiguration);
            if (metricsConfiguration.Enabled && metricsConfiguration.BasicAuth)
                if (string.IsNullOrEmpty(metricsConfiguration.Username) || string.IsNullOrEmpty(metricsConfiguration.Password))
                    throw new ArgumentNullException("Username or password can't be null or empty when metrics enablend and authroization enabled too.");
            return metricsConfiguration;
        }

        /// <summary>
        /// Get Coturn configuration
        /// </summary>
        public static CoturnConfiguration GetCoturnConfiguration(this IConfiguration configuration)
        {
            var coturnConfiguration = new CoturnConfiguration();
            configuration.GetSection("Coturn").Bind(coturnConfiguration);
            return coturnConfiguration;
        }

        /// <summary>
        /// Get Pwa configuration
        /// </summary>
        public static PwaConfiguration GetPwaConfiguration(this IConfiguration configuration)
        {
            var pwaConfiguration = new PwaConfiguration
            {
                SentryDsn = configuration.GetSection("Sentry").GetValue<string>("Dsn")
            };
            return pwaConfiguration;
        }
    }
}