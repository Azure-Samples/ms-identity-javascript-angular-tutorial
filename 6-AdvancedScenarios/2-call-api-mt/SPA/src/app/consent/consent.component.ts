import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { msalConfig, protectedResources } from '../auth-config';

@Component({
    selector: 'app-consent',
    templateUrl: './consent.component.html',
    styleUrls: ['./consent.component.css']
})
export class ConsentComponent implements OnInit {

    constructor(private authService: MsalService) { }

    ngOnInit(): void {
        this.processRedirectResponse();
    }

    processRedirectResponse() {
        const params = new URLSearchParams(decodeURIComponent(window.location.search));

        // TODO: grab the state parameter from the URL
        // TODO: get the state parameter from the storage
        // TODO: check if it matches the state parameter sent in the admin consent request

        if (!params.has('error') && params.get('admin_consent') === 'True') {
            window.history.replaceState(null, document.title, window.location.pathname); // remove query string from URL
        }
    }

    adminConsent() {
        const account = this.authService.instance.getActiveAccount()

        if (account) {
            // available only in HTTPS context
            const state = window.crypto.randomUUID(); // state parameter against csrf

            // TODO: save state to session storage

            /**
             * Construct URL for admin consent endpoint. For more information, visit:
             * https://docs.microsoft.com/azure/active-directory/develop/v2-admin-consent
             */
            const adminConsentUri = "https://login.microsoftonline.com/" +
                `${account.tenantId}` + "/v2.0/adminconsent?client_id=" +
                `${msalConfig.auth.clientId}` + "&state=" + `${state}` + "&redirect_uri=" + `http://localhost:4200/adminconsent` +
                "&scope=" + protectedResources.todoListApi.scopes.read[0] + " " + protectedResources.todoListApi.scopes.write[0];

            // redirect to admin consent endpoint
            window.location.replace(adminConsentUri);
        }
    }
}
