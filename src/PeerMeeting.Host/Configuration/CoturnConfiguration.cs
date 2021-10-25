namespace PeerMeeting.Host.Configuration
{
    public class CoturnConfiguration
    {
        public bool Enabled { get; set; }
        public string TurnAddress { get; set; }
        public string SharedSecret { get; set; }
        public int CredentialsTtl { get; set; } = 86400;
    }
}