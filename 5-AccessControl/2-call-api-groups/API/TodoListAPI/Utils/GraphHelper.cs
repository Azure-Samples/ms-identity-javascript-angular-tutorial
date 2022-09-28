using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Graph;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using TodoListAPI.Infrastructure;

namespace TodoListAPI.Utils
{
    public class GraphHelper
    {
        private const string Groups_Session_Key = "groupClaims";

        /// <summary>
        /// This method inspects the claims collection created from the ID or Access token issued to a user and returns the groups that are present in the token.
        /// If groups claims are already present in Session then it returns the list of groups by calling GetSessionGroupList method.
        /// If it detects groups overage, the method then makes calls to ProcessUserGroupsForOverage method.
        /// </summary>
        /// <param name="context">TokenValidatedContext</param>
        public static async Task FetchSignedInUsersGroups(TokenValidatedContext context)
        {
            // Checks if the incoming token contained a 'Group Overage' claim.
            if (HasOverageOccurred(context.Principal))
            {
                // Gets group values from session variable if exists.
                var usergroups = GetUserGroupsFromSession(context.HttpContext.Session);

                if (usergroups == null || usergroups?.Count == 0)
                {
                    usergroups = await ProcessUserGroupsForOverage(context);
                }

                // Populate the groups claim will all the groups to ensure that policy check works as expected
                if (usergroups?.Count > 0)
                {
                    var identity = (ClaimsIdentity)context.Principal.Identity;

                    if (identity != null)
                    {
                        //Remove any existing 'groups' claim
                        RemoveExistingGroupsClaims(identity);

                        // Re-populate the `groups` claim with the complete list of groups fetched from MS Graph
                        foreach (var group in usergroups)
                        {
                            // The following code adds group ids to the 'groups' claim. But depending upon your requirement and the format of the 'groups' claim selected in
                            // the app registration, you might want to add other attributes than id to the `groups` claim, examples being;

                            // For instance if the required format is 'NetBIOSDomain\sAMAccountName' then the code is as commented below:
                            // identity.AddClaim(new Claim("groups", group.OnPremisesNetBiosName+"\\"+group.OnPremisesSamAccountName));
                            identity.AddClaim(new Claim("groups", group));
                        }

                        // Here we add the groups in a session variable that is used in authorization policy handler.
                        context.HttpContext.Session.SetAsByteArray(Groups_Session_Key, usergroups);
                    }
                }
            }
        }

        /// <summary>
        /// Retrieves all the groups saved in Session.
        /// </summary>
        /// <param name="_httpContextSession"></param>
        /// <returns></returns>
        public static List<string> GetUserGroupsFromSession(ISession _httpContextSession)
        {
            // Checks if Session contains data for groupClaims.
            // The data will exist for 'Group Overage' claim if already populated.
            if (_httpContextSession.Keys.Contains(Groups_Session_Key))
            {
                return _httpContextSession.GetAsByteArray(Groups_Session_Key) as List<string>;
            }
            return null;
        }

        /// <summary>
        /// Checks if 'Group Overage' claim exists for signed-in user.
        /// </summary>
        /// <param name="identity"></param>
        /// <returns></returns>
        private static bool HasOverageOccurred(ClaimsPrincipal identity)
        {
            return identity.Claims.Any(x => x.Type == "hasgroups" || (x.Type == "_claim_names" && x.Value == "{\"groups\":\"src1\"}"));
        }

        /// <summary>
        /// ID Token does not contain 'scp' claim.
        /// This claims only exists in the Access Token.
        /// </summary>
        /// <param name="identity"></param>
        /// <returns></returns>
        private static bool IsAccessToken(ClaimsIdentity identity)
        {
            return identity.Claims.Any(x => x.Type == "scp" || x.Type == "http://schemas.microsoft.com/identity/claims/scope");
        }

        /// <summary>
        /// This method inspects the claims collection created from the ID or Access token issued to a user and returns the groups that are present in the token . If it detects groups overage,
        /// the method then makes calls to Microsoft Graph to fetch the group membership of the authenticated user.
        /// </summary>
        /// <param name="context">TokenValidatedContext</param>
        private static async Task<List<string>> ProcessUserGroupsForOverage(TokenValidatedContext context)
        {
            //IUserMemberOfCollectionWithReferencesPage memberPage = new UserMemberOfCollectionWithReferencesPage();
            var allgroups = new List<DirectoryObject>();

            try
            {
                // Before instatntiating GraphServiceClient, the app should have granted admin consent for 'GroupMember.Read.All' permission.
                var graphClient = context.HttpContext.RequestServices.GetService<GraphServiceClient>();

                if (graphClient == null)
                {
                    throw new ArgumentNullException("GraphServiceClient", "No service for type 'Microsoft.Graph.GraphServiceClient' has been registered in the Startup.");
                }

                // Checks if the SecurityToken is not null.
                // For the Web App, SecurityToken contains value of the ID Token.
                if (context.SecurityToken != null)
                {
                    // Checks if 'JwtSecurityTokenUsedToCallWebAPI' key already exists.
                    // This key is required to acquire Access Token for Graph Service Client.
                    if (!context.HttpContext.Items.ContainsKey("JwtSecurityTokenUsedToCallWebAPI"))
                    {
                        // For Web App, access token is retrieved using account identifier. But at this point account identifier is null.
                        // So, SecurityToken is saved in 'JwtSecurityTokenUsedToCallWebAPI' key.
                        // The key is then used to get the Access Token on-behalf of user.
                        context.HttpContext.Items.Add("JwtSecurityTokenUsedToCallWebAPI", context.SecurityToken as JwtSecurityToken);
                    }

                    // The properties that we want to retrieve from MemberOf endpoint.
                    string select = "id,displayName,onPremisesNetBiosName,onPremisesDomainName,onPremisesSamAccountNameonPremisesSecurityIdentifier";

                    try
                    {
                        //Request to get groups and directory roles that the user is a direct member of.
                        var memberPages = await graphClient.Me.MemberOf.Request().Select(select).GetAsync().ConfigureAwait(false);

                        // There is a limit to number of groups returned, so we paginate to get all groups.
                        allgroups = await CollectionProcessor<DirectoryObject>.ProcessGraphCollectionPageAsync(graphClient, memberPages);
                    }
                    catch (Exception graphEx)
                    {
                        var exMsg = graphEx.InnerException != null ? graphEx.InnerException.Message : graphEx.Message;
                        Console.WriteLine("Call to Microsoft Graph failed: " + exMsg);
                    }
                }
                else
                {
                    throw new ArgumentNullException("SecurityToken", "Group membership cannot be fetched if no tken has been provided.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            finally
            {
                // Checks if the key 'JwtSecurityTokenUsedToCallWebAPI' exists.
                if (context.HttpContext.Items.ContainsKey("JwtSecurityTokenUsedToCallWebAPI"))
                {
                    // Removes 'JwtSecurityTokenUsedToCallWebAPI' from Items collection.
                    // If not removed then it can cause failure to the application.
                    // Because this key is also added by StoreTokenUsedToCallWebAPI method of Microsoft.Identity.Web.
                    context.HttpContext.Items.Remove("JwtSecurityTokenUsedToCallWebAPI");
                }
            }

            return allgroups.Select(x => x.Id).ToList();
        }

        /// <summary>
        /// Remove groups claims if already exists.
        /// </summary>
        /// <param name="identity"></param>
        private static void RemoveExistingGroupsClaims(ClaimsIdentity identity)
        {
            //clear existing claim
            List<Claim> existingGroupsClaims = identity.Claims.Where(x => x.Type == "groups").ToList();
            if (existingGroupsClaims?.Count > 0)
            {
                foreach (Claim groupsClaim in existingGroupsClaims)
                {
                    identity.RemoveClaim(groupsClaim);
                }
            }
        }

        /// <summary>
        /// Checks if user is member of the required group.
        /// </summary>
        /// <param name="context"></param>
        /// <param name="GroupName"></param>
        /// <param name="_httpContextAccessor"></param>
        /// <returns></returns>
        public static bool CheckUsersGroupMembership(AuthorizationHandlerContext context, string GroupName, IHttpContextAccessor _httpContextAccessor)
        {
            bool result = false;
            // Checks if groups claim exists in claims collection of signed-in User.
            if (HasOverageOccurred(context.User))
            {
                // Calls method GetSessionGroupList to get groups from session.
                var groups = GetUserGroupsFromSession(_httpContextAccessor.HttpContext.Session);

                // Checks if required group exists in Session.
                if (groups?.Count > 0 && groups.Contains(GroupName))
                {
                    result = true;
                }
            }
            else if (context.User.Claims.Any(x => x.Type == "groups" && x.Value == GroupName))
            {
                result = true;
            }
            return result;
        }
    }
}