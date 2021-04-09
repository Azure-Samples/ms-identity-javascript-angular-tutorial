import { Injectable } from '@angular/core';
import { 
  CanActivate,
  ActivatedRouteSnapshot
} from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-common';

interface Account extends AccountInfo {
  idTokenClaims?: {
    roles?: string[]
  }
}

@Injectable({
    providedIn: 'root'
  })
export class RoleGuardService implements CanActivate {

  constructor(private authService: MsalService) {}
  
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRole = route.data.expectedRole;
    let account: Account = this.authService.instance.getAllAccounts()[0];

    if (!account.idTokenClaims?.roles) {
      window.alert('Token does not have roles claim. Please ensure that your account is assigned to an app role and then sign-out and sign-in again.');
      return false;
    } else if (!account.idTokenClaims?.roles?.includes(expectedRole)) {
      window.alert('You do not have access as expected role is missing. Please ensure that your account is assigned to an app role and then sign-out and sign-in again.');
      return false;
    }

    return true;
  }
}
