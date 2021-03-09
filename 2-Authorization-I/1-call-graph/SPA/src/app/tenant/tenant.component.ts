import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { protectedResources } from '../auth-config';

@Component({
  selector: 'app-tenant',
  templateUrl: './tenant.component.html',
  styleUrls: ['./tenant.component.css']
})
export class TenantComponent implements OnInit {

  displayedColumns: string[] = ['claim', 'value'];
  dataSource: any =[];

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.getTenant();
  }

  getTenant() {
    this.http.get(protectedResources.armTenants.endpoint)
      .subscribe((tenant: any) => {
        console.log(tenant);
        // this.dataSource = [
        //   {id: 1, claim: "Name", value: tenants ? tenants['givenName'] : null},
        //   {id: 2, claim: "Surname", value: profile ? tenants['surname'] : null},
        //   {id: 3, claim: "User Preferred Name (UPN)", value: profile ? profile['userPrincipalName'] : null},
        //   {id: 4, claim: "ID", value: profile ? profile['id']: null}
        // ];
      });
  }

}
