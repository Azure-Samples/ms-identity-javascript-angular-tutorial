import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { catchError } from 'rxjs/operators';

import { AccountInfo } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';

import { msalConfig, protectedResources } from './auth-config';
import { addClaimsToStorage } from './storage-utils';
import { parseChallenges } from './claim-utils';
import { Profile } from './profile';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    url = protectedResources.profileApi.endpoint;

    constructor(private http: HttpClient, private authService: MsalService) { }

    getProfile(id: string) {
        return this.http.get<Profile>(this.url + '/' + id)
            .pipe(
                catchError((error) => {
                    console.log(error);

                    if (error.status === 401 && error.headers.get('WWW-Authenticate')) {
                        this.handleClaimsChallenge(error)
                    }
                    return error;
                })
            );
    }

    postProfile(profile: Profile) {
        return this.http.post<Profile>(this.url, profile);
    }

    editProfile(profile: Profile) {
        return this.http.put<Profile>(this.url + '/' + profile.id, profile);
    }

    /**
     * This method inspects the HTTPS response from a http call for the "www-authenticate header"
     * If present, it grabs the claims challenge from the header and store it in the sessionStorage
     * For more information, visit: https://docs.microsoft.com/en-us/azure/active-directory/develop/claims-challenge#claims-challenge-header-format
     * @param response
     */
    handleClaimsChallenge(response: HttpErrorResponse): void {
        const authenticateHeader: string | null = response.headers.get('WWW-Authenticate');
        const claimsChallengeMap = parseChallenges(authenticateHeader!);
        let account: AccountInfo = this.authService.instance.getActiveAccount()!;

        /**
         * This method stores the claim challenge to the session storage in the browser to be used when acquiring a token.
         * To ensure that we are fetching the correct claim from the storage, we are using the clientId
         * of the application and oid (user’s object id) as the key identifier of the claim with schema
         * cc.<clientId>.<oid><resource.hostname>
         */
        addClaimsToStorage(
            `cc.${msalConfig.auth.clientId}.${account?.idTokenClaims?.oid}.${new URL(protectedResources.profileApi.endpoint).hostname}`,
            claimsChallengeMap['claims']
        );

        this.authService.instance.acquireTokenPopup({
            account: account,
            scopes: protectedResources.profileApi.scopes,
            claims: claimsChallengeMap['claims']
        }).catch((error) => {
            console.log(error);
        });
    }
}
