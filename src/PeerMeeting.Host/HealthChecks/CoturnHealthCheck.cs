using Microsoft.Extensions.Diagnostics.HealthChecks;
using PeerMeeting.Host.Configuration;
using System;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;

namespace PeerMeeting.Host.HealthChecks
{
    public class CoturnHealthCheck : IHealthCheck
    {
        private readonly string _turnAddress;

        public CoturnHealthCheck(CoturnConfiguration configuration)
        {
            _turnAddress = configuration.TurnAddress;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrEmpty(_turnAddress))
                return HealthCheckResult.Degraded("Coturn address is not configured, health check skipped.");

            try
            {
                var addressParts = _turnAddress.Split(':');
                if (addressParts.Length != 2)
                    return HealthCheckResult.Degraded("Invalid Coturn address format. Expected format: hostname:port");

                var host = addressParts[0];
                var port = int.Parse(addressParts[1]);

                using var client = new TcpClient();
                var connectTask = client.ConnectAsync(host, port);
                
                // Set a reasonable timeout
                var timeoutTask = Task.Delay(TimeSpan.FromSeconds(5), cancellationToken);
                var completedTask = await Task.WhenAny(connectTask, timeoutTask);
                
                if (completedTask == timeoutTask)
                    return HealthCheckResult.Degraded("Coturn connection timed out");

                return client.Connected
                    ? HealthCheckResult.Healthy("Coturn connection is healthy")
                    : HealthCheckResult.Degraded("Coturn connection failed");
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Degraded($"Coturn connection check failed: {ex.Message}");
            }
        }
    }
}