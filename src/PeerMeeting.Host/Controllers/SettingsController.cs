using Microsoft.AspNetCore.Mvc;
using PeerMeeting.Host.Configuration;

namespace PeerMeeting.Host.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly PwaConfiguration _pwaConfiguration;
        public SettingsController(PwaConfiguration pwaConfiguration)
        {
            _pwaConfiguration = pwaConfiguration;

        }

        [HttpGet]
        [ValidateAntiForgeryToken]
        public PwaConfiguration GetPwaConfiguration()
        {
            return _pwaConfiguration;
        }
    }
}