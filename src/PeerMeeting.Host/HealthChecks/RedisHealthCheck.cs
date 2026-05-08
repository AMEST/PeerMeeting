using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PeerMeeting.Host.HealthChecks
{
    public class RedisHealthCheck : IHealthCheck
    {
        private readonly string _connectionString;

        public RedisHealthCheck(string connectionString)
        {
            _connectionString = connectionString;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrEmpty(_connectionString))
                return HealthCheckResult.Degraded("Redis connection string is not configured");

            try
            {
                await using var connection = await ConnectionMultiplexer.ConnectAsync(_connectionString);
                var isAlive = connection.IsConnected;
                
                return isAlive 
                    ? HealthCheckResult.Healthy("Redis connection is healthy")
                    : HealthCheckResult.Unhealthy("Redis connection is not alive");
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy($"Redis connection failed: {ex.Message}");
            }
        }
    }
}