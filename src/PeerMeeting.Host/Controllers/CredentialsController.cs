using Microsoft.AspNetCore.Mvc;
using PeerMeeting.Domain;
using PeerMeeting.Domain.Contracts;
using PeerMeeting.Host.Configuration;

namespace PeerMeeting.Host.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CredentialsController : ControllerBase
    {
        private readonly CoturnConfiguration _coturnConfiguration;
        private readonly ICredentialsService _credentialsService;

        public CredentialsController(CoturnConfiguration coturnConfiguration, ICredentialsService credentialsService)
        {
            _coturnConfiguration = coturnConfiguration;
            _credentialsService = credentialsService;
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public TurnCredentials Generate([FromForm] string username)
        {
            return _coturnConfiguration.Enabled 
                ? _credentialsService.GenerateCredentials(username) 
                : null;
        }
    }
}