using System;

namespace PeerMeeting.Domain.Entities
{
    public class ChatMessage
    {
        public User User { get; set; } 
        public DateTime Date { get; set; }
        public string Message { get; set; }
    }
}