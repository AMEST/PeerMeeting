// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only

using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace PeerMeeting.Host.Hubs
{
    public class WebRtcHub : Hub
    {
        private readonly ILogger<WebRtcHub> _logger;

        public WebRtcHub(ILogger<WebRtcHub> logger)
        {
            _logger = logger;
        }

        public Task Send(string name, string message)
        {
            _logger.LogInformation("Command: {CommandName} \t\t Message: {Message}", name, message);
            return Clients.Group(name).SendAsync(name, message);
        }

        public Task JoinRoom(string name)
        {
            return Groups.AddToGroupAsync(Context.ConnectionId, name);
        }

        public Task LeavRoom(string name)
        {
            return Groups.RemoveFromGroupAsync(Context.ConnectionId, name);
        }
    }
}