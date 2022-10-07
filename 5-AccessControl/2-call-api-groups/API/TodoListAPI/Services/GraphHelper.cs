using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Graph;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using TodoListAPI.Infrastructure;

namespace TodoListAPI.Utils
{
    public class GraphHelper : IGraphHelper
    {
        private const string Groups_Cache_Key = "groupClaims_";
        private readonly IMemoryCache _memoryCache;
        private GraphServiceClient _graphServiceClient;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ICollectionProcessor<DirectoryObject> _collectionProcessor;

        public GraphHelper(GraphServiceClient graphServiceClient, IMemoryCache memoryCache, IHttpContextAccessor contextAccessor, ICollectionProcessor<DirectoryObject> collectionProcessor)
        {
            _graphServiceClient = graphServiceClient ?? throw new ArgumentNullException(nameof(graphServiceClient));
            _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));
            _httpContextAccessor = contextAccessor;
            _collectionProcessor = collectionProcessor;
        }

        /// <summary>
        /// This method inspects the claims collection created from the ID or Access token issued to a user and returns the groups that are present in the token.
        /// If groups claims are already present in Session then it returns the list of groups by calling GetSessionGroupList method.
        /// If it detects groups overage, the method then makes calls to ProcessUserGroupsForOverage method.
        /// </summary>
        /// <param name="context">TokenValidatedContext</param>
        public async Task FetchSignedInUsersGroups()
        {
            HttpContext httpContext = this._httpContextAccessor.HttpContext;
            var principal = httpContext.User;

            if (principal != null && principal.Identity != null)
            {
                ClaimsIdentity identity = principal.Identity as ClaimsIdentity;

                // Checks if the incoming token contained a 'Group Overage' claim.
                if (HasOverageOccurred(principal))
                {
                    // Gets group values from session variable if exists.
                    //var usergroups = GetUserGroupsFromSession(httpContext.Session, principal);
                    var usergroups = GetUserGroupsFromCache(principal);

                    if (usergroups == null || usergroups?.Count == 0)
                    {
                        usergroups = await ProcessUserGroupsForOverage();
                    }

                    // Populate the groups claim will all the groups to ensure that policy check works as expected
                    if (usergroups?.Count > 0)
                    {
                        //Remove any existing 'groups' claim
                        RemoveExistingGroupsClaimsFromPrincipal(identity);

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
                        //string cacheKey = $"{Groups_Session_Key}{GetUserObjectId(principal)}";
                        //httpContext.Session.SetAsByteArray(cacheKey, usergroups);
                        SetUsersGroupsToCache(usergroups, principal);
                    }
                }
            }
        }

        ///// <summary>
        ///// Retrieves all the groups saved in Session.
        ///// </summary>
        ///// <param name="_httpContextSession"></param>
        ///// <returns></returns>
        //private List<string> GetUserGroupsFromSession(ISession _httpContextSession, ClaimsPrincipal principal)
        //{
        //    // Checks if Session contains data for groupClaims.
        //    // The data will exist for 'Group Overage' claim if already populated.
        //    string cacheKey = $"{Groups_Session_Key}{GetUserObjectId(principal)}";

        //    if (_httpContextSession.Keys.Contains(cacheKey))
        //    {
        //        return _httpContextSession.GetAsByteArray(cacheKey) as List<string>;
        //    }

        //    return null;
        //}

        /// <summary>
        /// Retrieves all the groups saved in Cache.
        /// </summary>>
        /// <returns></returns>
        private List<string> GetUserGroupsFromCache(ClaimsPrincipal principal)
        {
            // Checks if Session contains data for groupClaims.
            // The data will exist for 'Group Overage' claim if already populated.
            string cacheKey = $"{Groups_Cache_Key}{GetUserObjectId(principal)}";

            if (_memoryCache.TryGetValue(cacheKey, out List<string> groups))
            {
                Debug.WriteLine($"Cache hit successful for '{cacheKey}'");
                return groups;
            }

            return null;
        }

        /// <summary>
        /// Saves the users groups to the memory cache.
        /// </summary>
        /// <param name="usersGroups">The users groups.</param>
        /// <param name="principal">The principal.</param>
        /// <autogeneratedoc />
        private void SetUsersGroupsToCache(List<String> usersGroups, ClaimsPrincipal principal)
        {
            string cacheKey = $"{Groups_Cache_Key}{GetUserObjectId(principal)}";

            Debug.WriteLine($"Adding users groups for '{cacheKey}'.");

            var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetSlidingExpiration(TimeSpan.FromSeconds(60))
                    .SetAbsoluteExpiration(TimeSpan.FromSeconds(3600))
                    .SetPriority(CacheItemPriority.Normal)
                    .SetSize(10240);

            this._memoryCache.Set(cacheKey, usersGroups, cacheEntryOptions);
        }

        /// <summary>
        /// Checks if 'Group Overage' claim exists for signed-in user.
        /// </summary>
        /// <param name="principal"></param>
        /// <returns></returns>
        private bool HasOverageOccurred(ClaimsPrincipal principal)
        {
            return principal.Claims.Any(x => x.Type == "hasgroups" || (x.Type == "_claim_names" && x.Value == "{\"groups\":\"src1\"}"));
        }

        /// <summary>
        /// ID Token does not contain 'scp' claim.
        /// This claims only exists in the Access Token.
        /// </summary>
        /// <param name="identity"></param>
        /// <returns></returns>
        private bool IsAccessToken(ClaimsIdentity identity)
        {
            return identity.Claims.Any(x => x.Type == "scp" || x.Type == "http://schemas.microsoft.com/identity/claims/scope");
        }

        private string GetUserObjectId(ClaimsPrincipal principal)
        {
            return principal.Claims.FirstOrDefault(x => x.Type == "oid").Value;
        }

        /// <summary>
        /// This method inspects the claims collection created from the ID or Access token issued to a user and returns the groups that are present in the token . If it detects groups overage,
        /// the method then makes calls to Microsoft Graph to fetch the group membership of the authenticated user.
        /// </summary>
        /// <param name="context">TokenValidatedContext</param>
        private async Task<List<string>> ProcessUserGroupsForOverage()
        {
            HttpContext context = this._httpContextAccessor.HttpContext;
            //IUserMemberOfCollectionWithReferencesPage memberPage = new UserMemberOfCollectionWithReferencesPage();
            var allgroups = new List<DirectoryObject>();

            try
            {
                // Before instantiating GraphServiceClient, the app should have granted admin consent for 'GroupMember.Read.All' permission.
                //var graphClient = context.RequestServices.GetService<GraphServiceClient>();

                if (_graphServiceClient == null)
                {
                    throw new ArgumentNullException("GraphServiceClient", "No service for type 'Microsoft.Graph.GraphServiceClient' has been registered in the Startup.");
                }
                else
                {
                    // The properties that we want to retrieve from MemberOf endpoint.
                    string select = "id,displayName,onPremisesNetBiosName,onPremisesDomainName,onPremisesSamAccountNameonPremisesSecurityIdentifier";

                    try
                    {
                        //Request to get groups and directory roles that the user is a direct member of.
                        var memberPages = await _graphServiceClient.Me.MemberOf.Request().Select(select).GetAsync().ConfigureAwait(false);

                        // There is a limit to number of groups returned, so we paginate to get all groups.
                        // TODO : using this throws ---> System.ObjectDisposedException: Cannot access a disposed object., why?
                        //CollectionProcessor<DirectoryObject> collectionProcessor = context.RequestServices.GetService<CollectionProcessor<DirectoryObject>>();
                        //allgroups = await _collectionProcessor.ProcessGraphCollectionPageAsync(memberPages);
                        allgroups = await ProcessIUserMemberOfCollectionPage(memberPages);
                        if (allgroups != null)
                        {
                            return allgroups.Select(x => x.Id).ToList();
                        }
                    }
                    catch (Exception graphEx)
                    {
                        // exMsg = graphEx.InnerException != null ? graphEx.InnerException.Message : graphEx.Message;
                        Debug.WriteLine("Call to Microsoft Graph failed: " + graphEx);
                    }
                }

                //// Checks if the SecurityToken is not null.
                //// For the Web App, SecurityToken contains value of the ID Token.
                //if (context.SecurityToken != null)
                //{
                //    // Checks if 'JwtSecurityTokenUsedToCallWebAPI' key already exists.
                //    // This key is required to acquire Access Token for Graph Service Client.
                //    if (!context.HttpContext.Items.ContainsKey("JwtSecurityTokenUsedToCallWebAPI"))
                //    {
                //        // For Web App, access token is retrieved using account identifier. But at this point account identifier is null.
                //        // So, SecurityToken is saved in 'JwtSecurityTokenUsedToCallWebAPI' key.
                //        // The key is then used to get the Access Token on-behalf of user.
                //        context.HttpContext.Items.Add("JwtSecurityTokenUsedToCallWebAPI", context.SecurityToken as JwtSecurityToken);
                //    }

                //}
                //else
                //{
                //    throw new ArgumentNullException("SecurityToken", "Group membership cannot be fetched if no token has been provided.");
                //}
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            finally
            {
                //// Checks if the key 'JwtSecurityTokenUsedToCallWebAPI' exists.
                //if (context.HttpContext.Items.ContainsKey("JwtSecurityTokenUsedToCallWebAPI"))
                //{
                //    // Removes 'JwtSecurityTokenUsedToCallWebAPI' from Items collection.
                //    // If not removed then it can cause failure to the application.
                //    // Because this key is also added by StoreTokenUsedToCallWebAPI method of Microsoft.Identity.Web.
                //    context.HttpContext.Items.Remove("JwtSecurityTokenUsedToCallWebAPI");
                //}
            }

            return null;
        }

        private async Task<List<DirectoryObject>> ProcessIUserMemberOfCollectionPage(IUserMemberOfCollectionWithReferencesPage groupsCollectionPage)
        {
            List<DirectoryObject> allGroups = new List<DirectoryObject>();

            try
            {
                if (groupsCollectionPage != null)
                {
                    do
                    {
                        // Page through results
                        foreach (var directoryObject in groupsCollectionPage.CurrentPage)
                        {
                            allGroups.Add(directoryObject);
                        }

                        // are there more pages (Has a @odata.nextLink ?)
                        if (groupsCollectionPage.NextPageRequest != null)
                        {
                            groupsCollectionPage = await groupsCollectionPage.NextPageRequest.GetAsync();
                        }
                        else
                        {
                            groupsCollectionPage = null;
                        }
                    } while (groupsCollectionPage != null);
                }
            }
            catch (ServiceException e)
            {
                Debug.WriteLine($"We could not process the groups's list: {e}");
                return null;
            }

            return allGroups;
        }

        /// <summary>
        /// Remove groups claims if already exists.
        /// </summary>
        /// <param name="identity"></param>
        private void RemoveExistingGroupsClaimsFromPrincipal(ClaimsIdentity identity)
        {
            // clear existing claim
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
        /// <param name="httpContextAccessor"></param>
        /// <returns></returns>
        public bool CheckUsersGroupMembership(AuthorizationHandlerContext context, string GroupName)
        {
            bool result = false;
            ClaimsPrincipal user = context.User;

            // Checks if groups claim exists in claims collection of signed-in User.
            if (HasOverageOccurred(user))
            {
                // Calls method GetSessionGroupList to get groups from session.
                //var groups = GetUserGroupsFromSession(_httpContextAccessor.HttpContext.Session, user);
                var groups = GetUserGroupsFromCache(user);

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