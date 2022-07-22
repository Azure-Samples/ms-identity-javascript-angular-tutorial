import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { BrowserUtils } from '@azure/msal-browser';

import { HomeComponent } from './home/home.component';
import { TodoViewComponent } from './todo-view/todo-view.component';
import { TodoEditComponent } from './todo-edit/todo-edit.component';
import { RedirectComponent } from './redirect/redirect.component';

/**
 * MSAL Angular can protect routes in your application using MsalGuard. For more info, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/initialization.md#secure-the-routes-in-your-application
 */
const routes: Routes = [
    {
        path: 'todo-edit/:id',
        component: TodoEditComponent,
        canActivate: [
            MsalGuard
        ]
    },
    {
        path: 'todo-view',
        component: TodoViewComponent,
        canActivate: [
            MsalGuard
        ]
    },
    {
        path: 'redirect',
        component: RedirectComponent,
    },
    {
        // Needed for hash routing
        path: 'error',
        component: HomeComponent
    },
    {
        // Needed for hash routing
        path: 'state',
        component: HomeComponent
    },
    {
        // Needed for hash routing
        path: 'code',
        component: HomeComponent
    },
    {
        path: '',
        component: HomeComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {
        // Don't perform initial navigation in iframes or popups
        initialNavigation: !BrowserUtils.isInIframe() && !BrowserUtils.isInPopup() ? 'enabledNonBlocking' : 'disabled' // Set to enabledBlocking to use Angular Universal
    })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
