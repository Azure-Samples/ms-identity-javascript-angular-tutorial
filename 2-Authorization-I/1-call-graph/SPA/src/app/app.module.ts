import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProfileComponent } from './profile/profile.component';
import { HomeComponent } from './home/home.component';
import { ContactsComponent } from './contacts/contacts.component';
import { AccountSwitchComponent } from './account-switch/account-switch.component';

import {
    IPublicClientApplication,
    PublicClientApplication,
    InteractionType,
} from '@azure/msal-browser';

import {
  MSAL_INSTANCE,
  MsalGuardConfiguration,
  MSAL_GUARD_CONFIG,
  MsalService,
  MsalBroadcastService,
  MsalGuard,
  MsalRedirectComponent,
  MsalInterceptor,
  MSAL_INTERCEPTOR_CONFIG,
  MsalInterceptorConfiguration,
  MsalModule,
} from '@azure/msal-angular';

import { msalConfig, loginRequest, protectedResources } from './auth-config';
import { getClaimsFromStorage } from './utils/storage-utils';
import { GraphService } from './graph.service';

/**
 * Here we pass the configuration parameters to create an MSAL instance.
 * For more info, visit: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/configuration.md
 */
export function MSALInstanceFactory(): IPublicClientApplication {
    return new PublicClientApplication(msalConfig);
}

/**
 * Set your default interaction type for MSALGuard here. If you have any
 * additional scopes you want the user to consent upon login, add them here as well.
 */
export function MsalGuardConfigurationFactory(): MsalGuardConfiguration {
    return {
        interactionType: InteractionType.Redirect,
        authRequest: loginRequest
    };
}

/**
 * MSAL Angular will automatically retrieve tokens for resources
 * added to protectedResourceMap. For more info, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/initialization.md#get-tokens-for-web-api-calls
 */
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
    const protectedResourceMap = new Map<string, Array<string>>();

    protectedResourceMap.set(protectedResources.graphMe.endpoint, protectedResources.graphMe.scopes);
    protectedResourceMap.set(protectedResources.graphContacts.endpoint, protectedResources.graphContacts.scopes);

    return {
        interactionType: InteractionType.Redirect,
        protectedResourceMap,
        authRequest: (msalService, httpReq, originalAuthRequest) => {
            const resource = new URL(httpReq.url).hostname;
            let claim =
                msalService.instance.getActiveAccount()! &&
                    getClaimsFromStorage(
                        `cc.${msalConfig.auth.clientId}.${msalService.instance.getActiveAccount()?.idTokenClaims?.oid
                        }.${resource}`
                    )
                    ? window.atob(
                        getClaimsFromStorage(
                            `cc.${msalConfig.auth.clientId}.${msalService.instance.getActiveAccount()?.idTokenClaims?.oid
                            }.${resource}`
                        )
                    )
                    : undefined; // claims challenge e.g {"access_token":{"xms_cc":{"values":["cp1"]}}}
            return {
                ...originalAuthRequest,
                claims: claim,
            };
        },
    };
}

@NgModule({
  declarations: [
    AppComponent,
    ProfileComponent,
    HomeComponent,
    ContactsComponent,
    AccountSwitchComponent,
  ],
  entryComponents: [AccountSwitchComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatMenuModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatIconModule,
    MsalModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true,
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory,
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MsalGuardConfigurationFactory,
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory,
    },
    MsalService,
    MsalBroadcastService,
    MsalGuard,
    GraphService,
  ],
  bootstrap: [AppComponent, MsalRedirectComponent],
})
export class AppModule {}
