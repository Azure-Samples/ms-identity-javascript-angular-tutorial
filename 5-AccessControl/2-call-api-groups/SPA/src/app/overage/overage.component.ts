import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

import { GraphService } from '../graph.service';
import { setGroupsInStorage } from '../utils/storage-utils';

import { groups } from '../auth-config';

@Component({
    selector: 'app-overage',
    templateUrl: './overage.component.html',
    styleUrls: ['./overage.component.css']
})
export class OverageComponent implements OnInit {

    requiredGroupsByApplication: string[] = [];

    constructor(private authService: MsalService, private graphService: GraphService) { }

    ngOnInit(): void {
        this.getGroups();
    }

    async getGroups(): Promise<void> {
        try {
            // Filter out the required groups defined in auth-config.ts
            this.requiredGroupsByApplication = await this.graphService.getFilteredGroups(Object.values(groups));
            
            const activeAccount = this.authService.instance.getActiveAccount() || this.authService.instance.getAllAccounts()[0];
            
            // Store the groups in session storage for this user
            setGroupsInStorage(activeAccount, this.requiredGroupsByApplication);
        } catch (error) {
            console.log(error);
        }
    }
}