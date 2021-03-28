import { Injectable } from '@angular/core';
import { 
  CanActivate,
  ActivatedRouteSnapshot,
  Router
} from '@angular/router';
import { AccountInfo } from '@azure/msal-common';
import { MsalService } from '@azure/msal-angular';
import { GraphService } from './graph.service';

interface Account extends AccountInfo {
  idTokenClaims?: {
    preferred_username?: string,
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

@Injectable({
    providedIn: 'root'
  })
export class GroupGuardService implements CanActivate {

  constructor(private authService: MsalService, private graphService: GraphService, private router: Router) {}
  
  canActivate(route: ActivatedRouteSnapshot): boolean {

    const expectedGroup = route.data.expectedGroup;
    let account: Account = this.authService.instance.getAllAccounts()[0];

    this.graphService.user.displayName = account.idTokenClaims?.preferred_username!;

    if (account.idTokenClaims?.groups?.includes(expectedGroup) || this.graphService.user.groupIDs.includes(expectedGroup)) {
      return true;
    }

    if (account.idTokenClaims?.groups) {
      this.graphService.user.groupIDs = account.idTokenClaims?.groups;
    } else {
      if (account.idTokenClaims?._claim_names) { 
        window.alert('You have too many group memberships. The application will now query Microsoft Graph to get the full list of groups that you are a member of.');
        this.router.navigate(['/overage']);
        return false;
      }

      window.alert('Token does not have groups claim.');
      return false;
    }

    window.alert('You do not have access for this.');
    return false;
  }
}