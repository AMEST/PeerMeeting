namespace PeerMeeting.Host.Configuration
{
    /// <summary>
    /// Metrics configurations
    /// </summary>
    public class MetricsConfiguration 
    {
        /// <summary>
        /// Is metrics enabled flaf
        /// </summary>
        public bool Enabled { get; set; }

        /// <summary>
        /// Endpoint url with promtheus metrics
        /// </summary>
        public string Endpoint { get; set; } = "/api/metrics";

        /// <summary>
        /// Is basic authentication enabled
        /// </summary>
        public bool BasicAuth {get; set;}

        /// <summary>
        /// Basic username
        /// </summary>
        public string Username { get; set; }

        /// <summary>
        /// Basic password
        /// </summary>
        public string Password { get; set; }
    }
}