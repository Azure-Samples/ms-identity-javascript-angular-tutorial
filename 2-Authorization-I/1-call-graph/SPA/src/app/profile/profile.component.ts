import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

import { protectedResources, msalConfig } from '../auth-config';
import { HttpClient } from '@angular/common/http';
import { addClaimsToStorage } from  '../util/storage.utils';

type ProfileType = {
  givenName?: string,
  surname?: string,
  userPrincipalName?: string,
  id?: string
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  profile!: ProfileType;
  displayedColumns: string[] = ['claim', 'value'];
  dataSource: any = [];

  constructor(private http: HttpClient, private authService: MsalService) {}

  ngOnInit() {

    this.getProfile();
  }

  getProfile() {

     this.http.get(protectedResources.graphMe.endpoint).subscribe(
       (profileResponse: ProfileType) => {
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
       },
       (error: any) => {
         if (error.status === 401) {
           if (error.headers.get('www-authenticate')) {
             const authenticateHeader: string =
               error.headers.get('www-authenticate');

             const claimsChallenge: any = authenticateHeader
               ?.split(' ')
               ?.find((entry) => entry.includes('claims='))
               ?.split('claims="')[1]
               ?.split('",')[0];

             let account: any = this.authService.instance.getActiveAccount();

             addClaimsToStorage(
               claimsChallenge,
               `cc.${msalConfig.auth.clientId}.${account?.idTokenClaims?.oid}`
             );
             this.authService.instance
               .acquireTokenRedirect({
                 account: account,
                 scopes: protectedResources.graphMe.scopes,
                 claims: window.atob(claimsChallenge),
               })
           }
         }
       }
     );
  }
}
