import { Injectable } from '@angular/core';

import { AuthenticationResult, InteractionRequiredAuthError } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';
import { Client, PageCollection, PageIterator, PageIteratorCallback } from '@microsoft/microsoft-graph-client';
import { DirectoryObject } from '@microsoft/microsoft-graph-types';

import { protectedResources } from './auth-config';

@Injectable({
    providedIn: 'root'
})
export class GraphService {

    constructor(private authService: MsalService) { }

    private getGraphClient(accessToken: string) {
        // Initialize Graph client
        const graphClient = Client.init({
            // Use the provided access token to authenticate requests
            authProvider: (done) => {
                done(null, accessToken);
            },
        });

        return graphClient;
    };

    private async getToken(scopes: string[]): Promise<string> {
        let authResponse: AuthenticationResult | null = null;

        try {
            authResponse = await this.authService.instance.acquireTokenSilent({
                account: this.authService.instance.getActiveAccount()!,
                scopes: scopes,
            });

        } catch (error) {
            if (error instanceof InteractionRequiredAuthError) {
                // TODO: get default interaction type from auth config

                authResponse = await this.authService.instance.acquireTokenPopup({
                    scopes: protectedResources.apiGraph.scopes,
                });
            }

            console.log(error);
        }

        return authResponse ? authResponse.accessToken : "";
    }

    async getFilteredGroups(filterGroups: string[] = []): Promise<string[]> {
        const groups: string[] = [];

        try {
            const accessToken = await this.getToken(protectedResources.apiGraph.scopes);

            // Get a graph client instance for the given access token
            const graphClient = this.getGraphClient(accessToken);

            const selectQuery = "id,displayName,onPremisesNetBiosName,onPremisesDomainName,onPremisesSamAccountNameonPremisesSecurityIdentifier";
            
            // Makes request to fetch groups list, which is expected to have multiple pages of data.
            let response: PageCollection = await graphClient.api(protectedResources.apiGraph.endpoint).select(selectQuery).get();

            // A callback function to be called for every item in the collection. This call back should return boolean indicating whether not to continue the iteration process.
            let callback: PageIteratorCallback = (data: DirectoryObject) => {
                if (data.id && filterGroups.includes(data.id)) groups.push(data.id); // Add the group id to the groups array
                if (filterGroups.filter(x => !groups.includes(x)).length === 0) return false; // Stop iterating if all the required groups are found
                return true;
            };

            // Creating a new page iterator instance with client a graph client instance, page collection response from request and callback
            let pageIterator = new PageIterator(graphClient, response, callback);

            // This iterates the collection until the nextLink is drained out.
            await pageIterator.iterate();

            return groups;
        } catch (error) {
            console.log(error);
        }

        return groups;
    }
}