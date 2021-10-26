namespace PeerMeeting.Host.Configuration
{
    public class MetricsConfiguration 
    {
        public bool Enabled { get; set; }
        public bool BasicAuth {get; set;}
        public string Username { get; set; }
        public string Password { get; set; }
    }
}