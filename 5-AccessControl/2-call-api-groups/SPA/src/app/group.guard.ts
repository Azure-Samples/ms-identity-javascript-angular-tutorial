import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Inject, Injectable } from "@angular/core";
import { Location } from "@angular/common";
import { Observable, of } from "rxjs";
import { concatMap } from "rxjs/operators";

import { MsalBroadcastService, MsalGuardConfiguration, MsalService, MSAL_GUARD_CONFIG } from "@azure/msal-angular";
import { AccountInfo } from "@azure/msal-browser";

import { BaseGuard } from "./base.guard";
import { checkGroupsInStorage, getGroupsFromStorage } from "./utils/storage-utils";

type AccountWithGroupClaims = AccountInfo & {
    idTokenClaims?: {
        groups?: string[],
        _claim_names?: {
            groups?: string | string[]
        },
        _claim_sources?: {
            src1?: {
                endpoint: string | string[]
            }
        }
    }
}

@Injectable()
export class GroupGuard extends BaseGuard {

    constructor(
        @Inject(MSAL_GUARD_CONFIG) protected override msalGuardConfig: MsalGuardConfiguration,
        protected override msalBroadcastService: MsalBroadcastService,
        protected override authService: MsalService,
        protected override location: Location,
        protected override router: Router,
    ) {
        super(msalGuardConfig, msalBroadcastService, authService, location, router);
    }

    override activateHelper(state?: RouterStateSnapshot, route?: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
        let result = super.activateHelper(state, route);

        const requiredGroups: string[] = route ? route.data['requiredGroups'] : [];

        return result.pipe(
            concatMap(() => {
                let activeAccount = this.authService.instance.getActiveAccount() as AccountWithGroupClaims;

                if (!activeAccount && this.authService.instance.getAllAccounts().length > 0) {
                    activeAccount = this.authService.instance.getAllAccounts()[0] as AccountWithGroupClaims;
                }

                // check either the ID token or a non-expired storage entry for the groups membership claim
                if (!activeAccount?.idTokenClaims?.groups && !checkGroupsInStorage(activeAccount)) {

                    if (activeAccount.idTokenClaims?._claim_names && activeAccount.idTokenClaims?._claim_names.groups) {
                        window.alert('You have too many group memberships. The application will now query Microsoft Graph to check if you are a member of any of the groups required.');
                        return this.router.navigate(['/overage']);
                    }
                    
                    window.alert('Token does not have groups claim. Please ensure that your account is assigned to a security group and then sign-out and sign-in again.');
                    return of(false);
                }

                const hasRequiredGroup = requiredGroups.some((group: string) =>
                    activeAccount?.idTokenClaims?.groups?.includes(group) || getGroupsFromStorage(activeAccount)?.includes(group)
                );

                if (!hasRequiredGroup) {
                    window.alert('You do not have access. Please ensure that your account is assigned to the required security group and then sign-out and sign-in again.');
                }

                return of(hasRequiredGroup);
            })
        );
    }
}