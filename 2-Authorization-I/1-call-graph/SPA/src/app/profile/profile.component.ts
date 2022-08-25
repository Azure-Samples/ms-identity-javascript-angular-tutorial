import { Component, OnInit } from '@angular/core';
import { InteractionType } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';

import { GraphService, ProviderOptions } from '../graph.service';
import { protectedResources } from '../auth-config';
import { ResponseType } from '@microsoft/microsoft-graph-client';
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
  ) {}

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
          if (response.headers.get('www-authenticate')) {
            this.graphService.handleClaimsChallenge(response, providerOptions);
          }
        }
      })
      .then((profileResponse: Profile) => {
        this.dataSource = [
          {
            id: 1,
            claim: 'Name',
            value: profileResponse ? profileResponse['givenName'] : null,
          },
          {
            id: 2,
            claim: 'Surname',
            value: profileResponse ? profileResponse['surname'] : null,
          },
          {
            id: 3,
            claim: 'User Principal Name (UPN)',
            value: profileResponse
              ? profileResponse['userPrincipalName']
              : null,
          },
          {
            id: 4,
            claim: 'ID',
            value: profileResponse ? profileResponse['id'] : null,
          },
        ];
      })
      .catch((error: any) => {
        console.log(error);
      });
  }
}
