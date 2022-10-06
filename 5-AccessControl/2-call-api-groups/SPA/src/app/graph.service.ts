import { Injectable } from '@angular/core';

import { AuthenticationResult, InteractionRequiredAuthError } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';
import { Client, PageCollection, PageIterator, PageIteratorCallback } from '@microsoft/microsoft-graph-client';

import { User } from './user';
import { protectedResources } from './auth-config';

@Injectable({
    providedIn: 'root'
})
export class GraphService {

    private user: User = {
        displayName: "",
        groupIDs: [],
    };

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
                authResponse = await this.authService.instance.acquireTokenPopup({
                    scopes: protectedResources.apiGraph.scopes,
                });
            }

            console.log(error);
        }

        return authResponse ? authResponse.accessToken : "";
    }

    getUser(): User {
        return this.user;
    };

    setGroups(groups: any): void {
        this.user.groupIDs = groups;
    };

    async getGroups(): Promise<string[]> {
        const allGroups: string[] = [];

        try {
            const accessToken = await this.getToken(protectedResources.apiGraph.scopes);

            // Get a graph client instance for the given access token
            const graphClient = this.getGraphClient(accessToken);

            // Makes request to fetch mails list. Which is expected to have multiple pages of data.
            let response: PageCollection = await graphClient.api(protectedResources.apiGraph.endpoint).get();
            
            // A callback function to be called for every item in the collection. This call back should return boolean indicating whether not to continue the iteration process.
            let callback: PageIteratorCallback = (data) => {
                allGroups.push(data.id); // Add the group id to the groups array
                return true;
            };
            
            // Creating a new page iterator instance with client a graph client instance, page collection response from request and callback
            let pageIterator = new PageIterator(graphClient, response, callback);
            
            // This iterates the collection until the nextLink is drained out.
            await pageIterator.iterate();

            return allGroups;
        } catch (error) {
            console.log(error);
        }

        return allGroups;
    }
}