// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Client;
using Microsoft.Identity.Web;
using Microsoft.Identity.Web.Resource;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.Graph;
using ProfileAPI.Models;

namespace ProfileAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        private readonly ProfileContext _context;
        private readonly ITokenAcquisition _tokenAcquisition;
        private readonly GraphServiceClient _graphServiceClient;
        private readonly IOptions<MicrosoftGraphOptions> _graphOptions;

        public ProfileController(ProfileContext context, ITokenAcquisition tokenAcquisition, GraphServiceClient graphServiceClient, IOptions<MicrosoftGraphOptions> graphOptions)
        {
            _context = context;
            _tokenAcquisition = tokenAcquisition;
            _graphServiceClient = graphServiceClient;
            _graphOptions = graphOptions;
        }

        // GET: api/ProfileItems/5
        [HttpGet("{id}")]
        [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:RequiredScopes")]
        public async Task<ActionResult<ProfileItem>> GetProfileItem(string id)
        {
            ProfileItem profileItem = await _context.ProfileItems.FindAsync(id);

            if (profileItem == null)
            {
                return NotFound();
            }

            return profileItem;
        }

        // POST api/values
        [HttpPost]
        [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:RequiredScopes")]
        public async Task<ActionResult<ProfileItem>> PostProfileItem(ProfileItem profileItem)
        {
            profileItem.FirstLogin = false;

            try
            {
                User profile = await _graphServiceClient.Me.Request().GetAsync();

                // populate with data from Graph
                profileItem.Id = profile.Id;
                profileItem.UserPrincipalName = profile.UserPrincipalName;
                profileItem.GivenName = profile.GivenName;
                profileItem.Surname = profile.Surname;
                profileItem.JobTitle = profile.JobTitle;
                profileItem.MobilePhone = profile.MobilePhone;
                profileItem.PreferredLanguage = profile.PreferredLanguage;
            }
            catch (MsalException ex)
            {
                return BadRequest("An authentication error occurred while acquiring a token for downstream API\n" + ex.ErrorCode + "\n" + ex.Message);
            }
            catch (MicrosoftIdentityWebChallengeUserException ex)
            {
                // append the WWW-Authenticate header from the eSTS response to the response to the client app
                // to learn more, visit: https://learn.microsoft.com/azure/active-directory/develop/v2-conditional-access-dev-guide
                _tokenAcquisition.ReplyForbiddenWithWwwAuthenticateHeader(_graphOptions.Value.Scopes.Split(' '), ex.MsalUiRequiredException);

                return Unauthorized(ex.MsalUiRequiredException.ResponseBody);
            }
            catch (ServiceException svcex) when (svcex.Message.Contains("Continuous access evaluation resulted in claims challenge"))
            {
                if (IsClientCapableofClaimsChallenge(HttpContext))
                {
                    // append the WWW-Authenticate header from the Microsoft Graph response to the response to the client app
                    // to learn more, visit: https://learn.microsoft.com/azure/active-directory/develop/app-resilience-continuous-access-evaluation?tabs=dotnet
                    HttpContext.Response.Headers.Add("WWW-Authenticate", svcex.ResponseHeaders.WwwAuthenticate.ToString());

                    return Unauthorized(svcex.RawResponseBody);
                } 
                else
                {
                    return Unauthorized("Continuous access evaluation resulted in claims challenge but the client is not capable. Please enable client capabilities and try again.");
                }
            }
            catch (Exception ex)
            {
                return BadRequest("An error occurred while calling the downstream API\n" + ex.Message);
            }

            _context.ProfileItems.Add(profileItem);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProfileItem", new { id = profileItem.Id }, profileItem);
        }

        // PUT: api/ProfileItems/5
        [HttpPut("{id}")]
        [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:RequiredScopes")]
        public async Task<IActionResult> PutProfileItem(string id, ProfileItem profileItem)
        {
            if (id != profileItem.Id)
            {
                return BadRequest();
            }

            // NOTE: We only update the entry in the local Db, and not in MS graph ..
            _context.Entry(profileItem).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProfileItemExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        private bool ProfileItemExists(string id)
        {
            return _context.ProfileItems.Any(e => e.Id == id);
        }

        /// <summary>
        /// Evaluates for the presence of the client capabilities claim (xms_cc) and accordingly returns a response if present.
        /// </summary>
        private bool IsClientCapableofClaimsChallenge(HttpContext context)
        {
            string clientCapabilitiesClaim = "xms_cc";

            if (context == null || context.User == null || context.User.Claims == null || !context.User.Claims.Any())
            {
                throw new ArgumentNullException(nameof(context), "No user context is available to pick claims from");
            }

            var ccClaim = context.User.FindAll(clientCapabilitiesClaim).FirstOrDefault(x => x.Type == "xms_cc");

            if (ccClaim != null && (ccClaim.Value == "cp1" || ccClaim.Value == "CP1"))
            {
                return true;
            }

            return false;
        }
    }
}
