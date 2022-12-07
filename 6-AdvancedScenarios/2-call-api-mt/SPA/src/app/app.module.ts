import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { OnboardComponent } from './onboard/onboard.component';
import { TodoEditComponent } from './todo-edit/todo-edit.component';
import { TodoViewComponent } from './todo-view/todo-view.component';
import { TodoService } from './todo.service';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { IPublicClientApplication, PublicClientApplication, InteractionType } from '@azure/msal-browser';
import {
    MsalGuard, MsalInterceptor, MsalBroadcastService, MsalInterceptorConfiguration, MsalModule, MsalService,
    MSAL_GUARD_CONFIG, MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG, MsalGuardConfiguration, MsalRedirectComponent, ProtectedResourceScopes
} from '@azure/msal-angular';

import { msalConfig, loginRequest, protectedResources } from './auth-config';
import { getClaimsFromStorage } from './storage-utils';

/**
 * Here we pass the configuration parameters to create an MSAL instance.
 * For more info, visit: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/configuration.md
 */
export function MSALInstanceFactory(): IPublicClientApplication {
    return new PublicClientApplication(msalConfig);
}

/**
 * MSAL Angular will automatically retrieve tokens for resources
 * added to protectedResourceMap. For more info, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/initialization.md#get-tokens-for-web-api-calls
 */
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
    const protectedResourceMap = new Map<string, Array<string | ProtectedResourceScopes> | null>();

    protectedResourceMap.set(protectedResources.todoListApi.endpoint, [
        {
            httpMethod: 'GET',
            scopes: [...protectedResources.todoListApi.scopes.read]
        },
        {
            httpMethod: 'POST',
            scopes: [...protectedResources.todoListApi.scopes.write]
        },
        {
            httpMethod: 'PUT',
            scopes: [...protectedResources.todoListApi.scopes.write]
        },
        {
            httpMethod: 'DELETE',
            scopes: [...protectedResources.todoListApi.scopes.write]
        }
    ]);

    return {
        interactionType: InteractionType.Popup,
        protectedResourceMap,
        authRequest: (msalService, httpReq, originalAuthRequest) => {
            const resource = new URL(httpReq.url).hostname;
            let claim = msalService.instance.getActiveAccount()! &&
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
                // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/multi-tenant.md#dynamic-auth-request
                authority: `https://login.microsoftonline.com/${originalAuthRequest.account?.tenantId ?? 'organizations'}`,
            };
        },
    };
}

/**
 * Set your default interaction type for MSALGuard here. If you have any
 * additional scopes you want the user to consent upon login, add them here as well.
 */
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
    return {
        interactionType: InteractionType.Redirect,
        authRequest: loginRequest
    };
}

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        TodoViewComponent,
        TodoEditComponent,
        OnboardComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        MatButtonModule,
        MatToolbarModule,
        MatListModule,
        MatTableModule,
        MatCardModule,
        MatInputModule,
        MatFormFieldModule,
        MatCheckboxModule,
        MatIconModule,
        MatSelectModule,
        HttpClientModule,
        FormsModule,
        MsalModule
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: MsalInterceptor,
            multi: true
        },
        {
            provide: MSAL_INSTANCE,
            useFactory: MSALInstanceFactory
        },
        {
            provide: MSAL_GUARD_CONFIG,
            useFactory: MSALGuardConfigFactory
        },
        {
            provide: MSAL_INTERCEPTOR_CONFIG,
            useFactory: MSALInterceptorConfigFactory
        },
        MsalService,
        MsalGuard,
        MsalBroadcastService,
        TodoService,
    ],
    bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule { }
