import { Component, OnInit } from '@angular/core';
import { protectedResources } from '../auth-config';
import { GraphService } from '../graph.service';
import { Profile } from '../profile';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  displayedColumns: string[] = ['claim', 'value'];
  dataSource: any = [];

  constructor(
    private graphService: GraphService,
  ) { }

  ngOnInit() {
    this.graphService
      .getData(protectedResources.graphMe.endpoint)
      .then((profileResponse: Profile) => {
        this.dataSource = [
          {
            id: 1,
            claim: 'Name',
            value: profileResponse ? profileResponse.givenName : null,
          },
          {
            id: 2,
            claim: 'Surname',
            value: profileResponse ? profileResponse.surname : null,
          },
          {
            id: 3,
            claim: 'User Principal Name (UPN)',
            value: profileResponse ? profileResponse.userPrincipalName : null,
          },
          {
            id: 4,
            claim: 'ID',
            value: profileResponse ? profileResponse.id : null,
          },
        ];
      })
      .catch((error) => {
        console.log(error);
      });
  }
}
