extern alias BetaLib;
using System;
using System.Collections.Generic;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Graph;
using Microsoft.Identity.Client;
using Microsoft.Identity.Web;
using Beta = BetaLib.Microsoft.Graph;

namespace TodoListService
{
    public class AuthenticationContextClassReferencesOperations
    {
        private Beta.GraphServiceClient _graphServiceClient;

        public AuthenticationContextClassReferencesOperations(Beta.GraphServiceClient graphServiceClient)
        {
            this._graphServiceClient = graphServiceClient;
            Beta.AuthenticationContextClassReference refn = new Beta.AuthenticationContextClassReference();
        }

        public async Task<List<Beta.AuthenticationContextClassReference>> ListAuthenticationContextClassReferencesAsync()
        {
            List<Beta.AuthenticationContextClassReference> allAuthenticationContextClassReferences = new List<Beta.AuthenticationContextClassReference>();

            try
            {
                Beta.IConditionalAccessRootAuthenticationContextClassReferencesCollectionPage authenticationContextClassreferences = await _graphServiceClient.Identity.ConditionalAccess.AuthenticationContextClassReferences.Request().GetAsync();

                if (authenticationContextClassreferences != null)
                {
                    allAuthenticationContextClassReferences = await ProcessIAuthenticationContextClassReferenceRootPoliciesCollectionPage(authenticationContextClassreferences);
                }
            }
            catch (ServiceException e)
            {
                Console.WriteLine($"We could not retrieve the existing ACRs: {e}");
                if (e.InnerException != null)
                {
                    var exp = (MicrosoftIdentityWebChallengeUserException)e.InnerException;
                    throw exp;
                }
                throw e;
            }

            return allAuthenticationContextClassReferences;
        }

        public async Task<Beta.AuthenticationContextClassReference> GetAuthenticationContextClassReferenceByIdAsync(string ACRId)
        {
            try
            {
                Beta.AuthenticationContextClassReference ACRObject = await _graphServiceClient.Identity.ConditionalAccess.AuthenticationContextClassReferences[ACRId].Request().GetAsync();
                return ACRObject;
            }
            catch (ServiceException gex)
            {
                if (gex.StatusCode != System.Net.HttpStatusCode.NotFound)
                {
                    throw;
                }
            }
            return null;
        }

        public async Task<Beta.AuthenticationContextClassReference> CreateAuthenticationContextClassReferenceAsync(string id, string displayName, string description, bool IsAvailable)
        {
            Beta.AuthenticationContextClassReference newACRObject = null;

            try
            {
                newACRObject = await _graphServiceClient.Identity.ConditionalAccess.AuthenticationContextClassReferences.Request().AddAsync(new Beta.AuthenticationContextClassReference
                {
                    Id = id,
                    DisplayName = displayName,
                    Description = description,
                    IsAvailable = IsAvailable,
                    ODataType = null
                });
            }
            catch (ServiceException e)
            {
                Console.WriteLine("We could not add a new ACR: " + e.Error.Message);
                return null;
            }

            return newACRObject;
        }

        public async Task<Beta.AuthenticationContextClassReference> UpdateAuthenticationContextClassReferenceAsync(string ACRId, bool IsAvailable, string displayName = null, string description = null)
        {
            Beta.AuthenticationContextClassReference ACRObjectToUpdate = await GetAuthenticationContextClassReferenceByIdAsync(ACRId);

            if (ACRObjectToUpdate == null)
            {
                throw new ArgumentNullException("id", $"No ACR matching '{ACRId}' exists");
            }

            try
            {
                ACRObjectToUpdate = await _graphServiceClient.Identity.ConditionalAccess.AuthenticationContextClassReferences[ACRId].Request().UpdateAsync(new Beta.AuthenticationContextClassReference
                {
                    Id = ACRId,
                    DisplayName = displayName ?? ACRObjectToUpdate.DisplayName,
                    Description = description ?? ACRObjectToUpdate.Description,
                    IsAvailable = IsAvailable,
                    ODataType = null
                });
            }
            catch (ServiceException e)
            {
                Console.WriteLine("We could not update the ACR: " + e.Error.Message);
                return null;
            }

            return ACRObjectToUpdate;
        }

        public async Task DeleteAuthenticationContextClassReferenceAsync(string ACRId)
        {
            try
            {
                await _graphServiceClient.Identity.ConditionalAccess.AuthenticationContextClassReferences[ACRId].Request().DeleteAsync();
            }
            catch (ServiceException e)
            {
                Console.WriteLine($"We could not delete the ACR with Id-{ACRId}: {e}");
            }
        }

        private async Task<List<Beta.AuthenticationContextClassReference>> ProcessIAuthenticationContextClassReferenceRootPoliciesCollectionPage(Beta.IConditionalAccessRootAuthenticationContextClassReferencesCollectionPage authenticationContextClassreferencesPage)
        {
            List<Beta.AuthenticationContextClassReference> allAuthenticationContextClassReferences = new List<Beta.AuthenticationContextClassReference>();

            try
            {
                if (authenticationContextClassreferencesPage != null)
                {
                    var pageIterator = PageIterator<Beta.AuthenticationContextClassReference>.CreatePageIterator(_graphServiceClient, authenticationContextClassreferencesPage, (authenticationContextClassreference) =>
                    {
                        Console.WriteLine(PrintAuthenticationContextClassReference(authenticationContextClassreference));
                        allAuthenticationContextClassReferences.Add(authenticationContextClassreference);
                        return true;
                    });

                    await pageIterator.IterateAsync();

                    while (pageIterator.State != PagingState.Complete)
                    {
                        await pageIterator.ResumeAsync();
                    }
                }
            }
            catch (ServiceException e)
            {
                Console.WriteLine($"We could not process the authentication context class references list: {e}");
                return null;
            }

            return allAuthenticationContextClassReferences;
        }

        public async Task<string> PrintAuthenticationContextClassReference(Beta.AuthenticationContextClassReference authenticationContextClassReference, bool verbose = false)
        {
            string toPrint = string.Empty;
            StringBuilder more = new StringBuilder();

            if (authenticationContextClassReference != null)
            {
                toPrint = $"DisplayName-{authenticationContextClassReference.DisplayName}, IsAvailable-{authenticationContextClassReference.IsAvailable}, Id- '{authenticationContextClassReference.Id}'";

                if (verbose)
                {
                    more.AppendLine($", Description-'{authenticationContextClassReference.Description}'");
                }
            }
            else
            {
                Console.WriteLine("The provided authenticationContextClassReference is null!");
            }

            return await Task.FromResult(toPrint + more.ToString());
        }
    }
}

