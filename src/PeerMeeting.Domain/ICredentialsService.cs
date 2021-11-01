using PeerMeeting.Domain.Contracts;

namespace PeerMeeting.Domain
{
    public interface ICredentialsService
    {
        TurnCredentials GenerateCredentials(string username);
    }
}