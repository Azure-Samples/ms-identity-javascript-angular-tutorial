import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { msalConfig, protectedResources } from './auth-config';
import { parseChallenges } from './utils/claim-utils';

import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { addClaimsToStorage } from './utils/storage-utils';

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  meEndpoint = protectedResources.graphMe.endpoint;
  contactsEndpoint = protectedResources.graphContacts.endpoint;

  constructor(private http: HttpClient, private authService: MsalService) { }

  getMe() {
    return this.http.get<any>(this.meEndpoint);
  }

  /**
   * This method inspects the HTTPS response from a http call for the "WWW-Authenticate header"
   * If present, it grabs the claims challenge from the header and store it in the sessionStorage
   * For more information, visit: https://docs.microsoft.com/en-us/azure/active-directory/develop/claims-challenge#claims-challenge-header-format
   * @param response
   */
  handleClaimsChallenge(response: any): void {
    const authenticateHeader: string = response.headers.get('WWW-Authenticate');
    const claimsChallengeMap: any = parseChallenges(authenticateHeader);
    let account: AccountInfo = this.authService.instance.getActiveAccount()!;

    /**
     * This method stores the claim challenge to the session storage in the browser to be used when acquiring a token.
     * To ensure that we are fetching the correct claim from the storage, we are using the clientId
     * of the application and oid (user’s object id) as the key identifier of the claim with schema
     * cc.<clientId>.<oid><resource.hostname>
     */
    addClaimsToStorage(
      claimsChallengeMap.claims,
      `cc.${msalConfig.auth.clientId}.${account?.idTokenClaims?.oid}.${new URL(protectedResources.graphMe.endpoint).hostname
      }`
    );

    this.authService.acquireTokenRedirect({
      scopes: protectedResources.graphMe.scopes,
      claims: window.atob(claimsChallengeMap.claims),
      account: account,
    });
  }
}
