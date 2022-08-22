import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { HttpClient } from '@angular/common/http';

import { AccountInfo } from '@azure/msal-browser';

import { addClaimsToStorage, getClaimsFromStorage } from './utils/storageUtils';
import { msalConfig, protectedResources } from './auth-config';

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
      this.http.get(endpoint).subscribe({
        next: (response) => {
          resolve(response);
        },
        error: (error) => {
          console.log(error, ' error');
          if (error.status === 401) {
            if (error.headers.get('www-authenticate')) {
              this.handleClaimsChallenge(error, endpoint);
            }
          }
          reject(error);
        },
      });
    });
  }

  /**
   * This method inspects the HTTPS response from a http call for the "www-authenticate header"
   * If present, it grabs the claims challenge from the header and store it in the sessionStorage
   * For more information, visit: https://docs.microsoft.com/en-us/azure/active-directory/develop/claims-challenge#claims-challenge-header-format
   * @param response
   */
  handleClaimsChallenge(response: any, endpoint: string): void {
    const authenticateHeader: string = response.headers.get('www-authenticate');

    const claimsChallengeMap: any = this.parseChallenges(authenticateHeader);

    let account: AccountInfo = this.authService.instance.getActiveAccount()!;
    addClaimsToStorage(
      claimsChallengeMap.claims,
      `cc.${msalConfig.auth.clientId}.${account?.idTokenClaims?.oid}.${
        new URL(endpoint).hostname
      }`
    );

    this.getAccessTokenInteractively(endpoint);
  }

  /**
   * This method fetches a new access token interactively
   */
  getAccessTokenInteractively(endpoint: string): void {
    this.authService.instance.acquireTokenRedirect({
      account: this.authService.instance.getActiveAccount()!,
      scopes:
        Object.values(protectedResources).find(
          (resource: { endpoint: string; scopes: string[] }) =>
            resource.endpoint === endpoint
        )?.scopes || [],
      claims:
        this.authService.instance.getActiveAccount()! &&
        getClaimsFromStorage(
          `cc.${msalConfig.auth.clientId}.${
            this.authService.instance.getActiveAccount()?.idTokenClaims?.oid
          }.${new URL(endpoint).hostname}`
        )
          ? window.atob(
              getClaimsFromStorage(
                `cc.${msalConfig.auth.clientId}.${
                  this.authService.instance.getActiveAccount()?.idTokenClaims
                    ?.oid
                }.${new URL(endpoint).hostname}`
              )
            )
          : undefined,
    });
  }

  /**
   * This method parses WWW-Authenticate authentication headers 
   * @param header
   * @return {Object} challengeMap
   */
  parseChallenges<T>(header: string): T {
    const schemeSeparator = header.indexOf(' ');
    const challenges = header.substring(schemeSeparator + 1).split(',');
    const challengeMap = {} as any;

    challenges.forEach((challenge: string) => {
      const [key, value] = challenge.split('=');
      challengeMap[key.trim()] = window.decodeURI(value.replace(/['"]+/g, ''));
    });

    return challengeMap;
  }
}
