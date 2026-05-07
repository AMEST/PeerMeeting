using Microsoft.Extensions.Diagnostics.HealthChecks;
using System;
using System.Threading;
using System.Threading.Tasks;
using System.Threading.Tasks.Dataflow;

namespace PeerMeeting.Host.HealthChecks
{
    public class ThreadPoolStarvationHealthCheck : IHealthCheck
    {
        public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            try
            {
                // Check if we're potentially facing thread pool starvation
                // by attempting to queue work to the thread pool
                var tcs = new TaskCompletionSource<bool>();
                var queueTask = Task.Run(() =>
                {
                    // This simple action doesn't block, but can help detect issues
                    Thread.Sleep(1);
                    tcs.SetResult(true);
                });
                
                // Wait with a timeout to detect starvation
                var timeoutTask = Task.Delay(TimeSpan.FromMilliseconds(100), cancellationToken);
                var completedTask = await Task.WhenAny(tcs.Task, timeoutTask);
                
                if (completedTask == timeoutTask)
                {
                    // If we timed out, it may indicate thread pool starvation
                    return HealthCheckResult.Unhealthy("ThreadPool starvation detected");
                }
                
                // Check for potential starvation by submitting more work
                var tasks = new Task[5];
                for (int i = 0; i < 5; i++)
                {
                    var iCopy = i;
                    tasks[i] = Task.Run(() =>
                    {
                        // Simple work that shouldn't cause issues on healthy systems
                        Thread.Sleep(10);
                    });
                }
                
                // Wait for all tasks to complete or timeout
                var allTasks = Task.WhenAll(tasks);
                var timeout = Task.Delay(TimeSpan.FromMilliseconds(500), cancellationToken);
                var result = await Task.WhenAny(allTasks, timeout);
                
                if (result == timeout)
                {
                    return HealthCheckResult.Unhealthy("ThreadPool is starved, tasks are not completing");
                }
                
                return HealthCheckResult.Healthy("ThreadPool is healthy");
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy($"ThreadPool check failed: {ex.Message}");
            }
        }
    }
}