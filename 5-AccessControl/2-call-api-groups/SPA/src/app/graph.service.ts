import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { User } from './user';
import { protectedResources } from './auth-config';

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  user: User = {
    displayName: "",
    groupIDs: [],
  };
  
  uri = protectedResources.graphApi.endpoint;

  constructor(private http: HttpClient) { }

  getGroups() {
    return this.http.get(this.uri);
  }

  getNextPage(nextPage: any) {
    return this.http.get(nextPage);
  }
}
