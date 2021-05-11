using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace PeerMeeting.Host.Hubs
{
    public class WebRtcHub : Hub
    {
        private readonly ILogger<WebRtcHub> _logger;

        public WebRtcHub(ILogger<WebRtcHub> logger)
        {
            _logger = logger;
        }

        public void Send(string name, string message)
        {
            // Call the broadcastMessage method to update clients.
            _logger.LogInformation("Command: {CommandName} \t\t Message: {Message}", name, message);
            Clients.All.SendAsync(name, message);
        }
    }
}