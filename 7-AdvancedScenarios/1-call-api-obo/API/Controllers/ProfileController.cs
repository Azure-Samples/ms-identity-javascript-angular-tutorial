// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Client;
using Microsoft.Identity.Web;
using Microsoft.Identity.Web.Resource;
using Microsoft.EntityFrameworkCore;
using Microsoft.Graph;
using ProfileAPI.Models;
using Newtonsoft.Json;
using Microsoft.Extensions.Options;

namespace ProfileAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        /// <summary>
        /// The Web API will only accept tokens 1) for users, and 
        /// 2) having the access_as_user scope for this API
        /// </summary>
        static readonly string[] scopeRequiredByApi = new string[] { "access_as_user" };

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
        public async Task<ActionResult<ProfileItem>> GetProfileItem(string id)
        {
            HttpContext.VerifyUserHasAnyAcceptedScope(scopeRequiredByApi);

            var profileItem = await _context.ProfileItems.FindAsync(id);

            if (profileItem == null)
            {
                return NotFound();
            }

            return profileItem;
        }

        // POST api/values
        [HttpPost]
        public async Task<ActionResult<ProfileItem>> PostProfileItem(ProfileItem profileItem)
        {
            HttpContext.VerifyUserHasAnyAcceptedScope(scopeRequiredByApi);

            profileItem.FirstLogin = false;

            // This is a synchronous call, so that the clients know, when they call Get, that the 
            // call to the downstream API (Microsoft Graph) has completed.
            try
            {
                User profile = await _graphServiceClient.Me.Request().GetAsync();

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
                HttpContext.Response.ContentType = "application/json";
                HttpContext.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                await HttpContext.Response.WriteAsync(JsonConvert.SerializeObject("An authentication error occurred while acquiring a token for downstream API\n" + ex.ErrorCode + "\n" + ex.Message));
            }
            catch (Exception ex)
            {
                if (ex.InnerException is MicrosoftIdentityWebChallengeUserException challengeException)
                {
                    await _tokenAcquisition.ReplyForbiddenWithWwwAuthenticateHeaderAsync(_graphOptions.Value.Scopes.Split(' '),
                        challengeException.MsalUiRequiredException);
                    HttpContext.Response.ContentType = "application/json";
                    HttpContext.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    await HttpContext.Response.WriteAsync(JsonConvert.SerializeObject("interaction required"));
                }
                else
                {
                    HttpContext.Response.ContentType = "application/json";
                    HttpContext.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    await HttpContext.Response.WriteAsync(JsonConvert.SerializeObject("An error occurred while calling the downstream API\n" + ex.Message));
                }
            }

            _context.ProfileItems.Add(profileItem);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProfileItem", new { id = profileItem.Id }, profileItem);
        }



        // PUT: api/ProfileItems/5
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for
        // more details see https://aka.ms/RazorPagesCRUD.
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProfileItem(string id, ProfileItem profileItem)
        {
            HttpContext.VerifyUserHasAnyAcceptedScope(scopeRequiredByApi);

            if (id != profileItem.Id)
            {
                return BadRequest();
            }

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
    }
}
