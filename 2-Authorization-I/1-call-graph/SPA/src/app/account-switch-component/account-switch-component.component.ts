import { Component, OnInit, Inject } from '@angular/core';
import {
  MsalService,
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration,
} from '@azure/msal-angular';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  RedirectRequest,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';

@Component({
  selector: 'app-account-switch-component',
  templateUrl: './account-switch-component.component.html',
  styleUrls: ['./account-switch-component.component.css'],
})
export class AccountSwitchComponentComponent implements OnInit {
  accounts: any = [];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService
  ) {}

  ngOnInit(): void {}

  switchAccount(account: any) {
    const activeAccount = this.authService.instance.getActiveAccount();
    if (!account) {
      this.authService.instance.setActiveAccount(account);
      this.authService.instance.loginRedirect({
        ...this.msalGuardConfig.authRequest,
        prompt: 'login',
      } as RedirectRequest);
    } else if (
      account &&
      activeAccount?.homeAccountId != account.homeAccountId
    ) {
      this.authService.instance.setActiveAccount(account);
      this.authService.instance.ssoSilent({
          ...this.msalGuardConfig.authRequest,
          account: account,
        }).then(() => {
          window.location.reload()
        }).catch((error) => {
          if (error instanceof InteractionRequiredAuthError) {
            this.authService.instance.loginRedirect({
              ...this.msalGuardConfig.authRequest,
              prompt: 'login',
            } as RedirectRequest);
          }
        });
    }
  }
}
