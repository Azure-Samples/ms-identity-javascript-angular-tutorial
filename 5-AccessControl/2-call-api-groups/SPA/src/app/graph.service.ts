import { Injectable } from '@angular/core';

import { AuthenticationResult, InteractionRequiredAuthError } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';

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
        let groups: string[] = [];

        try {
            const accessToken = await this.getToken(protectedResources.apiGraph.scopes);

            // Get a graph client instance for the given access token
            const graphClient = this.getGraphClient(accessToken);

            // Makes request to fetch groups list, which is expected to have multiple pages of data.
            let response: PageCollection = await graphClient.api(protectedResources.apiGraph.endpoint)
                .post({
                    groupIds: filterGroups
                });

            groups = response.value;
            return groups;
        } catch (error) {
            console.log(error);
        }

        return groups;
    }
}