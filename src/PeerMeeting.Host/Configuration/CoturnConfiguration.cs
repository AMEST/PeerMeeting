namespace PeerMeeting.Host.Configuration
{
    /// <summary>
    /// Coturn configuration
    /// </summary>
    public class CoturnConfiguration
    {
        /// <summary>
        /// Is coturn enabled flag
        /// </summary>
        public bool Enabled { get; set; }

        /// <summary>
        /// Coturn server ip:port 
        /// </summary>
        public string TurnAddress { get; set; }

        /// <summary>
        /// Shared secret for generating temporary passwords
        /// </summary>
        public string SharedSecret { get; set; }

        /// <summary>
        /// Credentials ttl
        /// </summary>
        public int CredentialsTtl { get; set; } = 86400;
    }
}