import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Inject, Injectable } from "@angular/core";
import { Location } from "@angular/common";
import { Observable, of } from "rxjs";
import { concatMap } from "rxjs/operators";

import { MsalBroadcastService, MsalGuardConfiguration, MsalService, MSAL_GUARD_CONFIG } from "@azure/msal-angular";
import { BaseGuard } from "./base.guard";

@Injectable()
export class RoleGuard extends BaseGuard {

  constructor(
    @Inject(MSAL_GUARD_CONFIG) protected override msalGuardConfig: MsalGuardConfiguration,
    protected override msalBroadcastService: MsalBroadcastService,
    protected override authService: MsalService,
    protected override location: Location,
    protected override router: Router
  ) {
    super(msalGuardConfig, msalBroadcastService, authService, location, router);
  }

  override activateHelper(state?: RouterStateSnapshot, route?: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    let result = super.activateHelper(state, route);

    const expectedRoles: string[] = route ? route.data['expectedRoles'] : [];

    return result.pipe(
      concatMap(() => {
        let activeAccount = this.authService.instance.getActiveAccount();

        if (!activeAccount && this.authService.instance.getAllAccounts().length > 0) {
            activeAccount = this.authService.instance.getAllAccounts()[0];
        }

        if (!activeAccount?.idTokenClaims?.roles) {
            window.alert('Token does not have roles claim. Please ensure that your account is assigned to an app role and then sign-out and sign-in again.');
            return of(false);
        }

        const hasRequiredRole = expectedRoles.some((role: string) => activeAccount?.idTokenClaims?.roles?.includes(role));

        if (!hasRequiredRole) {
            window.alert('You do not have access as the expected role is not found. Please ensure that your account is assigned to an app role and then sign-out and sign-in again.');
        }

        return of(hasRequiredRole);
      })
    );
  }
}