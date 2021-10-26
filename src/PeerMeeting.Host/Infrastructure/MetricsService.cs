using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PeerMeeting.Host.Configuration;
using Prometheus.DotNetRuntime;

namespace PeerMeeting.Host.Infrastructure
{
    internal class MetricsService : BackgroundService
    {
        private readonly ILogger<MetricsService> _logger;
        private readonly MetricsConfiguration _configuration;
        private IDisposable _collector;

        public MetricsService(ILogger<MetricsService> logger, MetricsConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if(!_configuration.Enabled)
                return Task.CompletedTask;

            var builder = DotNetRuntimeStatsBuilder.Customize()
                    .WithContentionStats(CaptureLevel.Informational)
                    .WithGcStats(CaptureLevel.Verbose)
                    .WithThreadPoolStats(CaptureLevel.Informational)
                    .WithExceptionStats(CaptureLevel.Errors)
                    .WithJitStats()
                    .WithErrorHandler(ex => _logger.LogError(ex, "Unexpected exception occurred in prometheus-net.DotNetRuntime"));

            _logger.LogInformation("Starting prometheus-net.DotNetRuntime...");

            _collector = builder.StartCollecting();

            return Task.CompletedTask;
        }

        public override void Dispose()
        {
            _collector?.Dispose();
            base.Dispose();
        }
    }
}