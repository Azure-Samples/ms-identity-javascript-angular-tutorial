using System;
using Xunit;
using Microsoft.Extensions.Configuration;

namespace TodoListAPI.Tests
{
    public class ConfigurationTests
    {
        public static IConfiguration InitConfiguration()
        {
            var config = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .Build();

            return config;
        }

        [Fact]
        public void ShouldContainClientId()
        {
            var myConfiguration = ConfigurationTests.InitConfiguration();
            var clientId = myConfiguration.GetSection("AzureAdB2C")["ClientId"];

            Assert.True(Guid.TryParse(clientId, out var theGuid));
        }

        [Fact]
        public void ShouldContainDomain()
        {
            var myConfiguration = ConfigurationTests.InitConfiguration();
            var domain = $"https://{myConfiguration.GetSection("AzureAdB2C")["Domain"]}";

            Assert.True(Uri.TryCreate(domain, UriKind.Absolute, out var uri));
        }

        [Fact]
        public void ShouldContainInstance()
        {
            var myConfiguration = ConfigurationTests.InitConfiguration();

            Assert.True(Uri.TryCreate(myConfiguration.GetSection("AzureAdB2C")["Instance"], UriKind.Absolute, out var uri));
        }
    }
}
