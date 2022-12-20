import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

import { msalConfig, protectedResources } from '../auth-config';
import { addClaimsToStorage, getClaimsFromStorage, removeClaimsFromStorage, clearStorage } from '../storage-utils';

@Component({
    selector: 'app-onboard',
    templateUrl: './onboard.component.html',
    styleUrls: ['./onboard.component.css']
})
export class OnboardComponent implements OnInit {

    onboardUrl: string = "";
    
    constructor(private authService: MsalService, private router: Router, private route: ActivatedRoute) { }

    ngOnInit(): void {
        this.onboardUrl = window.location.origin + "/onboard";

        // if redirected, process redirect response
        if (this.route.snapshot.queryParamMap.has('admin_consent')) {
            this.processRedirectResponse();
        }
    }

    processRedirectResponse() {
        const account = this.authService.instance.getActiveAccount()!;
        const previousState = getClaimsFromStorage(account.homeAccountId);

        if (!this.route.snapshot.queryParamMap.has('error') && this.route.snapshot.queryParamMap.get('admin_consent') === 'True') {
            if (previousState === this.route.snapshot.queryParamMap.get('state')) { 
                // state parameter matches
                removeClaimsFromStorage(account.homeAccountId);
                this.router.navigate(['/todo-view']);
            } else {
                clearStorage(account.homeAccountId); // clear sessionStorage of any claims entry 
                this.authService.logoutRedirect(); // state parameter does not match, so logout
            }
        }
    }

    adminConsent() {
        const account = this.authService.instance.getActiveAccount();

        if (account) {
            const state = window.crypto.randomUUID(); // state parameter against csrf

            addClaimsToStorage(account.homeAccountId, state);

            /**
             * Construct URL for admin consent endpoint. For more information, visit:
             * https://docs.microsoft.com/azure/active-directory/develop/v2-admin-consent
             */
            const adminConsentUri = "https://login.microsoftonline.com/" +
                `${account.tenantId}` + "/v2.0/adminconsent?client_id=" +
                `${msalConfig.auth.clientId}` + "&state=" + `${state}` + "&redirect_uri=" + `http://localhost:4200/adminconsent` +
                "&scope=" + `${protectedResources.todoListApi.scopes.read[0].split("/TodoList")[0]}/.default`;

            // redirect to admin consent endpoint
            window.location.replace(adminConsentUri);
        }
    }
}
