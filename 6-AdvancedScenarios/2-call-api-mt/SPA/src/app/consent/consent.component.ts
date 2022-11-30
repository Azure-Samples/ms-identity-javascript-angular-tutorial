import { Component } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { msalConfig, protectedResources } from '../auth-config';

@Component({
  selector: 'app-consent',
  templateUrl: './consent.component.html',
  styleUrls: ['./consent.component.css']
})
export class ConsentComponent {
  
  constructor(private authService: MsalService) { }

  adminConsent() { 
      const account = this.authService.instance.getActiveAccount()

      if (account) {
        const state = Math.floor(Math.random() * 90000) + 10000; // state parameter for anti token forgery
        
          /**
           * Construct URL for admin consent endpoint. For more information, visit:
           * https://docs.microsoft.com/azure/active-directory/develop/v2-admin-consent
           */
          const adminConsentUri = "https://login.microsoftonline.com/" + 
          `${account.tenantId}` + "/v2.0/adminconsent?client_id=" + 
          `${msalConfig.auth.clientId}` + "&state=" + `${state}` + "&redirect_uri=" + `${window.location.origin}` +
          "&scope=" + `${protectedResources.todoListApi.scopes.read[0]} ${protectedResources.todoListApi.scopes.write[0]}`;
    
        // redirect to admin consent endpoint
        window.location.replace(adminConsentUri);
      }
  }
}
