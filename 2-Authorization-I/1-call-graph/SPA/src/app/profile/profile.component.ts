import { Component, OnInit } from '@angular/core';
import { InteractionType } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';
import { ResponseType } from '@microsoft/microsoft-graph-client';

import { GraphService, ProviderOptions } from '../graph.service';
import { protectedResources } from '../auth-config';
import { Profile } from '../profile';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
    profile!: Profile;
    displayedColumns: string[] = ['claim', 'value'];
    dataSource: any = [];

    constructor(
        private graphService: GraphService,
        private authService: MsalService
    ) { }

    ngOnInit() {
        const providerOptions: ProviderOptions = {
            account: this.authService.instance.getActiveAccount()!,
            scopes: protectedResources.graphMe.scopes,
            interactionType: InteractionType.Redirect,
            endpoint: protectedResources.graphMe.endpoint,
        };

        this.getProfile(providerOptions);
    }

    getProfile(providerOptions: ProviderOptions) {
        this.graphService
            .getGraphClient(providerOptions)
            .api('/me')
            .responseType(ResponseType.RAW)
            .get()
            .then((response: any) => {
                if (response.status === 200) return response.json();
                if (response.status === 401) {
                    if (response.headers.get('WWW-Authenticate')) {
                        this.graphService.handleClaimsChallenge(response, providerOptions);
                    }
                }
            })
            .then((profileResponse: Profile) => {
                Object.entries(profileResponse).forEach((claim: [string, unknown]) => {
                    this.dataSource = [...this.dataSource, { claim: claim[0], value: claim[1] }];
                });
            })
            .catch((error: any) => {
                console.log(error);
            });
    }
}
