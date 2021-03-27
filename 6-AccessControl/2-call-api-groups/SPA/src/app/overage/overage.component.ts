import { Component, OnInit } from '@angular/core';
import { GraphService } from '../graph.service';

import * as auth from '../auth-config.json';

@Component({
  selector: 'app-overage',
  templateUrl: './overage.component.html',
  styleUrls: ['./overage.component.css']
})
export class OverageComponent implements OnInit {

  groups: string[] = [];

  constructor(private service: GraphService) { }

  ngOnInit(): void {
    this.handleResponse();
  }

  handleResponse(): void {
    this.service.getGroups()
      .subscribe((response: any) => {
        response.value.map((v: any) => this.groups.push(v.id));

        /**
         * Some queries against Microsoft Graph return multiple pages of data either due to server-side paging 
         * or due to the use of the $top query parameter to specifically limit the page size in a request. 
         * When a result set spans multiple pages, Microsoft Graph returns an @odata.nextLink property in 
         * the response that contains a URL to the next page of results.
         * learn more at https://docs.microsoft.com/graph/paging
         */
        if (response['@odata.nextLink']) {
          this.handleNextPage(response['@odata.nextLink'])
        } else {
          if (this.groups.includes(auth.groups.groupAdmin)) {
            this.service.user.groupIDs.push(auth.groups.groupAdmin)
          }

          if (this.groups.includes(auth.groups.groupMember)) {
            this.service.user.groupIDs.push(auth.groups.groupMember)
          }
        }

        console.log(this.groups);
    });
  }

  handleNextPage(nextPage: any): void {
    this.service.getNextPage(nextPage)
      .subscribe((response: any) => {

        response.value.map((v: any) => {
          if (!this.groups.includes(v.id)) {
            this.groups.push(v.id);
          }
        });

        if (response['@odata.nextLink']) {
          this.handleNextPage(response['@odata.nextLink'])
        } else {
          if (this.groups.includes(auth.groups.groupAdmin)) {
            this.service.user.groupIDs.push(auth.groups.groupAdmin);
          }

          if (this.groups.includes(auth.groups.groupMember)) {
            this.service.user.groupIDs.push(auth.groups.groupMember);
          }
        }
      })
  }
}