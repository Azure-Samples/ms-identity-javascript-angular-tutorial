import { Component, OnInit } from '@angular/core';

import { GraphService } from '../graph.service';

import { groups } from '../auth-config';

@Component({
    selector: 'app-overage',
    templateUrl: './overage.component.html',
    styleUrls: ['./overage.component.css']
})
export class OverageComponent implements OnInit {

    allGroups: string[] = [];

    constructor(private graphService: GraphService) { }

    ngOnInit(): void {
        this.getGroups();
    }

    async getGroups(): Promise<void> {
        this.allGroups = await this.graphService.getGroups();

        // Filter out the required groups defined in auth-config.ts
        const requiredGroups = this.allGroups.filter((id) => id === groups.groupAdmin || id === groups.groupMember);
            
        // Set the groups in the graph service
        this.graphService.setGroups(requiredGroups);
    }

}