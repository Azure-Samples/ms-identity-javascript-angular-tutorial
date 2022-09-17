import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Inject, Injectable } from "@angular/core";
import { Location } from "@angular/common";
import { Observable, of } from "rxjs";
import { concatMap } from "rxjs/operators";

import { MsalBroadcastService, MsalGuardConfiguration, MsalService, MSAL_GUARD_CONFIG } from "@azure/msal-angular";
import { AccountInfo } from "@azure/msal-browser";

import { BaseGuard } from "./base.guard";
import { GraphService } from "./graph.service";

type AccountWithGroupClaims = AccountInfo & {
    idTokenClaims?: {
        groups?: string[],
        _claim_names?: {
            groups: string | string[]
        },
        _claim_sources?: {
            src1: {
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
        private graphService: GraphService
    ) {
        super(msalGuardConfig, msalBroadcastService, authService, location, router);
    }

    override activateHelper(state?: RouterStateSnapshot, route?: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
        let result = super.activateHelper(state, route);

        const expectedGroups: string[] = route ? route.data['expectedGroups'] : [];

        return result.pipe(
            concatMap(() => {
                let activeAccount = this.authService.instance.getActiveAccount() as AccountWithGroupClaims;

                if (!activeAccount && this.authService.instance.getAllAccounts().length > 0) {
                    activeAccount = this.authService.instance.getAllAccounts()[0] as AccountWithGroupClaims;
                }

                if (!activeAccount?.idTokenClaims?.groups && this.graphService.getUser().groupIDs.length === 0) {
                    if (activeAccount.idTokenClaims?._claim_names) {
                        window.alert('You have too many group memberships. The application will now query Microsoft Graph to get the full list of groups that you are a member of.');
                        return this.router.navigate(['/overage']);
                    }
                    
                    window.alert('Token does not have groups claim. Please ensure that your account is assigned to a security group and then sign-out and sign-in again.');
                    return of(false);
                }

                const hasRequiredGroup = expectedGroups.some((group: string) =>
                    activeAccount?.idTokenClaims?.groups?.includes(group) 
                    ||
                    this.graphService.getUser().groupIDs.includes(group)
                );

                if (!hasRequiredGroup) {
                    window.alert('You do not have access. Please ensure that your account is assigned to the required security group and then sign-out and sign-in again.');
                }

                return of(hasRequiredGroup);
            })
        );
    }
}