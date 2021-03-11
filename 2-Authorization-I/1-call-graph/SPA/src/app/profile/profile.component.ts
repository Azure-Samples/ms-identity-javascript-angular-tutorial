import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { protectedResources } from '../auth-config';

type ProfileType = {
  givenName?: string,
  surname?: string,
  userPrincipalName?: string,
  id?: string
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  
  profile!: ProfileType;
  displayedColumns: string[] = ['claim', 'value'];
  dataSource: any =[];
  
  constructor(
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.getProfile();
  }

  getProfile() {
    this.http.get(protectedResources.graphMe.endpoint)
      .subscribe((profile: ProfileType) => {
        this.dataSource = [
          {id: 1, claim: "Name", value: profile ? profile['givenName'] : null},
          {id: 2, claim: "Surname", value: profile ? profile['surname'] : null},
          {id: 3, claim: "User Principal Name (UPN)", value: profile ? profile['userPrincipalName'] : null},
          {id: 4, claim: "ID", value: profile ? profile['id']: null}
        ];
      });
  }
}
