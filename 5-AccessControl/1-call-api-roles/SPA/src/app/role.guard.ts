import { Injectable } from '@angular/core';
import {
    CanActivate,
    ActivatedRouteSnapshot
} from '@angular/router';

import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-common';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {

    constructor(private authService: MsalService) { }

    canActivate(route: ActivatedRouteSnapshot): boolean {
        const expectedRoles: string[] = route.data['expectedRoles'];
        let account: AccountInfo = this.authService.instance.getActiveAccount()!;

        if (!account.idTokenClaims?.roles) {
            window.alert('Token does not have roles claim. Please ensure that your account is assigned to an app role and then sign-out and sign-in again.');
            return false;
        }

        if (!expectedRoles.includes(account.idTokenClaims.roles[0])) {
            window.alert('You do not have access as the expected role is not found. Please ensure that your account is assigned to an app role and then sign-out and sign-in again.');
            return false;
        }

        return true;
    }
}
