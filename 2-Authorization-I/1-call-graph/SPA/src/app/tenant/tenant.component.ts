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
    this.http.get('https://management.azure.com/tenants?api-version=2020-01-01')
      .subscribe((tenant: any) => {
        this.dataSource = [
          {id: 1, claim: "Name", value: tenant ? tenant.value[0]['displayName'] : null},
          {id: 2, claim: "Name", value: tenant ? tenant.value[0]['defaultDomain'] : null},
          {id: 3, claim: "Surname", value: tenant ? tenant.value[0]['tenantId'] : null},
          {id: 3, claim: "Surname", value: tenant ? tenant.value[0]['tenantType'] : null},
        ];
      });
  }

}
