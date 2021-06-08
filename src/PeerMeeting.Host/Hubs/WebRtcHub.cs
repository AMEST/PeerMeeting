// Copyright 2021 Klabukov Erik.
// SPDX-License-Identifier: GPL-3.0-only

using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace PeerMeeting.Host.Hubs
{
    /// <summary>
    /// WebRTC signaling hub
    /// </summary>    
    public class WebRtcHub : Hub
    {
        private readonly ILogger<WebRtcHub> _logger;

        /// <summary>
        /// Constructor
        /// </summary>
        public WebRtcHub(ILogger<WebRtcHub> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Send message to all users in room
        /// </summary>
        /// <param name="name">Room name</param>
        /// <param name="message">JSON message</param>
        public Task Send(string name, string message)
        {
            _logger.LogDebug("Command: {CommandName} \t\t Message: {Message}", name, message);
            return Clients.Group(name).SendAsync(name, message);
        }

        /// <summary>
        /// Join to room
        /// </summary>
        /// <param name="name">Room name</param>
        public Task JoinRoom(string name)
        {
            return Groups.AddToGroupAsync(Context.ConnectionId, name);
        }

        /// <summary>
        /// Leave from room
        /// </summary>
        public Task LeavRoom(string name)
        {
            return Groups.RemoveFromGroupAsync(Context.ConnectionId, name);
        }
    }
}