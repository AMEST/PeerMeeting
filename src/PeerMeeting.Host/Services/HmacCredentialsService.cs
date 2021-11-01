using System;
using System.Security.Cryptography;
using System.Text;
using PeerMeeting.Domain;
using PeerMeeting.Domain.Contracts;
using PeerMeeting.Host.Configuration;

namespace PeerMeeting.Host.Services
{
    internal class HmacCredentialsService : ICredentialsService
    {
        private readonly CoturnConfiguration _configuration;

        public HmacCredentialsService(CoturnConfiguration configuration)
        {
            _configuration = configuration;
        }

        public TurnCredentials GenerateCredentials(string username)
        {
            var credentialsExpire = DateTimeOffset.UtcNow.AddSeconds(_configuration.CredentialsTtl).ToUnixTimeSeconds();
            var generatedUsername = $"{credentialsExpire}:{username}";
            var password = GetHMACMessage(_configuration.SharedSecret, generatedUsername);
            return new TurnCredentials
            {
                Username = generatedUsername,
                Password = password,
                Ttl = _configuration.CredentialsTtl,
                Uris = new []{$"turn:{_configuration.TurnAddress}?transport=udp" }
            };
        }

        private string GetHMACMessage(string secret, string message)
        {
            var keyByte = Encoding.UTF8.GetBytes(secret);
            var hmacsha1 = new HMACSHA1(keyByte);
            var messageBytes = Encoding.UTF8.GetBytes(message);
            var hashmessage = hmacsha1.ComputeHash(messageBytes);
            return Convert.ToBase64String(hashmessage);
        }
    }
}