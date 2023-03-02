import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

import { GraphService } from '../graph.service';
import { Profile } from '../profile';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  profile!: Profile;
  displayedColumns: string[] = ['claim', 'value'];
  dataSource: any = [];

  constructor(
    private graphService: GraphService,
    private authService: MsalService
  ) { }

  ngOnInit() {
    this.getProfile();
  }

  getProfile() {

    this.graphService.getMe().subscribe(
      data => {
        Object.entries(data).forEach((claim: [string, unknown]) => {
          this.dataSource = [...this.dataSource, { claim: claim[0], value: claim[1] }];
        });
      },
      error => {
        if (error.status === 401) {
          if (error.headers.get('WWW-Authenticate')) {
            this.graphService.handleClaimsChallenge(error);
          }
        }
      }
    );
  }
}
