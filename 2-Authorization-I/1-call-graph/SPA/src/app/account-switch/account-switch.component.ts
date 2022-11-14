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
  SilentRequest,
  AccountInfo,
} from '@azure/msal-browser';
import {
PromptValue
} from '@azure/msal-common';

@Component({
  selector: 'app-account-switch-component',
  templateUrl: './account-switch.component.html',
  styleUrls: ['./account-switch.component.css'],
})
export class AccountSwitchComponent implements OnInit {
  accounts: AccountInfo[] = [];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService
  ) {}

  ngOnInit(): void {}

  switchAccount(account: AccountInfo | null) {
    const activeAccount = this.authService.instance.getActiveAccount();
    this.authService.instance.setActiveAccount(account);
    if (!account) {
      this.authService.instance.loginRedirect({
        ...this.msalGuardConfig.authRequest,
        prompt: PromptValue.LOGIN,
      } as RedirectRequest);
    } else if (
      account &&
      activeAccount?.homeAccountId !== account.homeAccountId
    ) {
      this.authService.instance
        .ssoSilent({
          ...this.msalGuardConfig.authRequest,
          account: account,
        } as SilentRequest)
        .then(() => {
          window.location.reload();
        })
        .catch((error) => {
          if (error instanceof InteractionRequiredAuthError) {
            this.authService.instance.loginRedirect({
              ...this.msalGuardConfig.authRequest,
              prompt: PromptValue.LOGIN,
            } as RedirectRequest);
          }
        });
    }
  }
}
