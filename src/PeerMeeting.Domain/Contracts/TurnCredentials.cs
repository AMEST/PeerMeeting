namespace PeerMeeting.Domain.Contracts
{
    public class TurnCredentials
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public int Ttl { get; set; }
        public string[] Uris { get; set; }
    }
}