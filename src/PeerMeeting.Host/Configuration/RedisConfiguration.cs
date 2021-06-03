namespace PeerMeeting.Host.Configuration
{
    /// <summary>
    /// Redis backplane and distributed cache configuration
    /// </summary>
    public class RedisConfiguration
    {
        /// <summary>
        /// Is Redis backplane and distributed cache enabled
        /// </summary>
        public bool Enabled { get; set; } = false;

        /// <summary>
        /// Redis connection string
        /// </summary>
        public string ConnectionString { get; set; }
    }
}