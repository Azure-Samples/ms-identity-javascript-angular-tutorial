import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MsalRedirectComponent } from '@azure/msal-angular';
import { BrowserUtils } from '@azure/msal-browser';

import { HomeComponent } from './home/home.component';
import { TodoViewComponent } from './todo-view/todo-view.component';
import { TodoEditComponent } from './todo-edit/todo-edit.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { OverageComponent } from './overage/overage.component';

import { BaseGuard } from './base.guard';
import { GroupGuard } from './group.guard';
import { groups } from './auth-config';

/**
 * MSAL Angular can protect routes in your application using MsalGuard. For more info, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/initialization.md#secure-the-routes-in-your-application
 */
const routes: Routes = [
    {
        path: 'todo-edit/:id',
        component: TodoEditComponent,
        canActivate: [
            GroupGuard
        ],
        data: {
            requiredGroups: [groups.groupMember, groups.groupAdmin]
        }
    },
    {
        path: 'todo-view',
        component: TodoViewComponent,
        canActivate: [
            GroupGuard
        ],
        data: {
            requiredGroups: [groups.groupMember, groups.groupAdmin]
        }
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [
            GroupGuard,
        ],
        data: {
            requiredGroups: [groups.groupAdmin]
        }
    },
    {
        path: 'overage',
        component: OverageComponent,
        canActivate: [
            BaseGuard,
        ]
    },
    {
        // Needed for handling redirect after login
        path: 'auth',
        component: MsalRedirectComponent
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
