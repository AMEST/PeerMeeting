using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;
using System;
using System.Net.Sockets;
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
            {
                return HealthCheckResult.Unhealthy("Redis connection string is not configured");
            }

            try
            {
                var connection = await ConnectionMultiplexer.ConnectAsync(_connectionString);
                var isAlive = connection.IsConnected;
                await connection.CloseAsync();
                
                if (isAlive)
                {
                    return HealthCheckResult.Healthy("Redis connection is healthy");
                }
                else
                {
                    return HealthCheckResult.Unhealthy("Redis connection is not alive");
                }
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy($"Redis connection failed: {ex.Message}");
            }
        }
    }
}