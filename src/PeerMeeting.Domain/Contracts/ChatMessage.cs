using System;

namespace PeerMeeting.Domain.Contracts
{
    public class ChatMessage
    {
        public User User { get; set; } 
        public DateTime Date { get; set; }
        public string Message { get; set; }
    }
}