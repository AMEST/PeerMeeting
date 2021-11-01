using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using PeerMeeting.Domain.Contracts;

namespace PeerMeeting.Host.Hubs
{
    /// <summary>
    /// Chat hub for room
    /// </summary>
    public class ChatHub : Hub
    {
        /// <summary>
        /// Send message to chat
        /// </summary>
        /// <param name="message">Message text</param>
        /// <param name="roomName">Room name</param>
        /// <param name="user">User who send</param>
        public async Task SendChatMessage(string message, string roomName, User user)
        {
            if(user == null)
                return;

            var chatMessage = new ChatMessage
            {
                User = user,
                Message = message,
                Date = DateTime.UtcNow
            };
            await Clients.Group(roomName).SendAsync("HandleChatMessage", chatMessage);
        }

        /// <summary>
        /// Join user to chat room
        /// </summary>
        public async Task JoinChat(string name, User user)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, name);
        }
    }
}