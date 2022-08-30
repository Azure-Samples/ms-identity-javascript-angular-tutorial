import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BrowserUtils } from '@azure/msal-browser';
import { MsalGuard, MsalRedirectComponent } from '@azure/msal-angular';

import { ProfileComponent } from './profile/profile.component';
import { ContactsComponent } from './contacts/contacts.component';
import { HomeComponent } from './home/home.component';

/**
 * MSAL Angular can protect routes in your application
 * using MsalGuard. For more info, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/initialization.md#secure-the-routes-in-your-application
 */
const routes: Routes = [
    {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [MsalGuard],
    },
    {
        path: 'contacts',
        component: ContactsComponent,
        canActivate: [MsalGuard],
    },
    {
        // Needed for handling redirect after login
        path: 'auth',
        component: MsalRedirectComponent,
    },
    {
        path: '',
        component: HomeComponent,
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {
            // Don't perform initial navigation in iframes or popups
            initialNavigation:
                !BrowserUtils.isInIframe() && !BrowserUtils.isInPopup()
                    ? 'enabledNonBlocking'
                    : 'disabled', // Set to enabledBlocking to use Angular Universal
        }),
    ],
    exports: [RouterModule],
})
export class AppRoutingModule { }
