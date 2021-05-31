import { Component, OnInit } from '@angular/core';
import { InteractionType } from "@azure/msal-browser";
import { MsalService } from '@azure/msal-angular';

import { GraphService, ProviderOptions } from '../graph.service';
import { protectedResources } from '../auth-config';

type ProfileType = {
  givenName?: string,
  surname?: string,
  userPrincipalName?: string,
  id?: string
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  
  profile!: ProfileType;
  displayedColumns: string[] = ['claim', 'value'];
  dataSource: any =[];
  
  constructor(private graphService: GraphService, private authService: MsalService) { }

  ngOnInit() {

    const providerOptions: ProviderOptions = {
      account: this.authService.instance.getActiveAccount()!, 
      scopes: protectedResources.graphMe.scopes, 
      interactionType: InteractionType.Popup
    };

    this.getProfile(providerOptions);
  }

  getProfile(providerOptions: ProviderOptions) {
    this.graphService.getGraphClient(providerOptions)
    .api('/me').get()
    .then((profileResponse: ProfileType) => {
      this.dataSource = [
        {id: 1, claim: "Name", value: profileResponse ? profileResponse['givenName'] : null},
        {id: 2, claim: "Surname", value: profileResponse ? profileResponse['surname'] : null},
        {id: 3, claim: "User Principal Name (UPN)", value: profileResponse ? profileResponse['userPrincipalName'] : null},
        {id: 4, claim: "ID", value: profileResponse ? profileResponse['id']: null}
      ];
    })
    .catch((error) => {
      console.log(error);
    });
  }
}
