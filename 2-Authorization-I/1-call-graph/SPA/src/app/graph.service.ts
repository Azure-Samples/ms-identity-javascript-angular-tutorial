import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { HttpClient } from '@angular/common/http';

import { protectedResources, msalConfig } from './auth-config';
import { addClaimsToStorage, getClaimsFromStorage } from './util/storage.utils';

@Injectable({
  providedIn: 'root',
})
export class GraphService {
  constructor(private authService: MsalService, private http: HttpClient) {}

  /**
   * Makes a GET request using authorization header For more, visit:
   * https://tools.ietf.org/html/rfc6750
   * @param endpoint
   * @returns
   */
  getData(endpoint: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(endpoint).subscribe(
        (response: any) => {
          resolve(response);
        },
        (error: any) => {
          if (error.status === 401) {
            this.handleClaimsChallenge(error);
          }
          reject(error);
        }
      );
    });
  }

  /**
   * This method inspects the HTTPS response from a http call for the "www-authenticate header"
   * If present, it grabs the claims challenge from the header and store it in the sessionStorage
   * For more information, visit: https://docs.microsoft.com/en-us/azure/active-directory/develop/claims-challenge#claims-challenge-header-format
   * @param response
   */
  handleClaimsChallenge(response: any): void {
    if (response.headers.get('www-authenticate')) {
      const authenticateHeader: string =
        response.headers.get('www-authenticate');
      const claimsChallenge: any = authenticateHeader
        ?.split(' ')
        ?.find((entry) => entry.includes('claims='))
        ?.split('claims="')[1]
        ?.split('",')[0];
      let account: any = this.authService.instance.getActiveAccount();
      addClaimsToStorage(
        claimsChallenge,
        `cc.${msalConfig.auth.clientId}.${account?.idTokenClaims?.oid}.${protectedResources.graphMe.resource}`
      );

      this.getAccessTokenInteractively();
    }
  }

  /**
   * This method fetches a new access token interactively
   */
  getAccessTokenInteractively(): void {
    this.authService.instance.acquireTokenRedirect({
      account: this.authService.instance.getActiveAccount()!,
      scopes: protectedResources.graphMe.scopes,
      claims:
        this.authService.instance.getActiveAccount()! &&
        getClaimsFromStorage(
          `cc.${msalConfig.auth.clientId}.${
            this.authService.instance.getActiveAccount()?.idTokenClaims?.oid
          }.${protectedResources.graphMe.resource}`
        )
          ? window.atob(
              getClaimsFromStorage(
                `cc.${msalConfig.auth.clientId}.${
                  this.authService.instance.getActiveAccount()?.idTokenClaims
                    ?.oid
                }.${protectedResources.graphMe.resource}`
              )
            )
          : '',
    });
  }
}