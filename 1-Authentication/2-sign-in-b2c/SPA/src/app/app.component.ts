import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { EventMessage, EventType, InteractionType, InteractionStatus, PopupRequest, RedirectRequest, AuthenticationResult, AuthError } from '@azure/msal-browser';

import { b2cPolicies } from './auth-config';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'Microsoft identity platform';
    isIframe = false;
    loginDisplay = false;
    private readonly _destroying$ = new Subject<void>();

    constructor(
        @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
        private authService: MsalService,
        private msalBroadcastService: MsalBroadcastService
    ) { }

    ngOnInit(): void {
        this.isIframe = window !== window.parent && !window.opener;

        /**
         * You can subscribe to MSAL events as shown below. For more info,
         * visit: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/events.md
         */
        this.msalBroadcastService.inProgress$
            .pipe(
                filter((status: InteractionStatus) => status === InteractionStatus.None),
                takeUntil(this._destroying$)
            )
            .subscribe(() => {
                this.setLoginDisplay();
            });
    }

    setLoginDisplay() {
        this.loginDisplay = this.authService.instance.getAllAccounts().length > 0;
    }

    loginWithPolicy1(userFlowRequest?: RedirectRequest | PopupRequest) {
        if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
            if (this.msalGuardConfig.authRequest) {
                this.authService.loginPopup({ ...this.msalGuardConfig.authRequest, ...userFlowRequest } as PopupRequest)
                    .subscribe((response: AuthenticationResult) => {
                        this.authService.instance.setActiveAccount(response.account);
                    });
            } else {
                this.authService.loginPopup(userFlowRequest)
                    .subscribe((response: AuthenticationResult) => {
                        this.authService.instance.setActiveAccount(response.account);
                    });
            }
        } else {
            if (this.msalGuardConfig.authRequest) {
                this.authService.loginRedirect({ ...this.msalGuardConfig.authRequest, ...userFlowRequest } as RedirectRequest);
            } else {
                this.authService.loginRedirect(userFlowRequest);
            }
        }
    }

    loginWithPolicy2(userFlowRequest?: RedirectRequest | PopupRequest) {
        if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
            if (this.msalGuardConfig.authRequest) {
                this.authService.loginPopup({
                    authority: b2cPolicies.authorities.signUpSignIn2.authority,
                    ...this.msalGuardConfig.authRequest,
                    ...userFlowRequest
                } as PopupRequest)
                    .subscribe((response: AuthenticationResult) => {
                        this.authService.instance.setActiveAccount(response.account);
                    });
            } else {
                this.authService.loginPopup({
                    authority: b2cPolicies.authorities.signUpSignIn2.authority,
                    scopes: [],
                    ...userFlowRequest
                }).subscribe((response: AuthenticationResult) => {
                    this.authService.instance.setActiveAccount(response.account);
                });
            }
        } else {
            if (this.msalGuardConfig.authRequest) {
                this.authService.loginRedirect({
                    authority: b2cPolicies.authorities.signUpSignIn2.authority,
                    ...this.msalGuardConfig.authRequest,
                    ...userFlowRequest
                } as RedirectRequest);
            } else {
                this.authService.loginRedirect({
                    authority: b2cPolicies.authorities.signUpSignIn2.authority,
                    scopes: [],
                    ...userFlowRequest
                });
            }
        }
    }

    logout() {
        this.authService.logout();
    }

    editProfile() {
        let editProfileFlowRequest = {
            scopes: [],
            authority: b2cPolicies.authorities.editProfile.authority,
        };

        this.loginWithPolicy1(editProfileFlowRequest);
    }

    ngOnDestroy(): void {
        this._destroying$.next(undefined);
        this._destroying$.complete();
    }
}
