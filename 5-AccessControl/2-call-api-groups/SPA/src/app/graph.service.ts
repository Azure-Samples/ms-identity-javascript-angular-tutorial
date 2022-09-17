import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { User } from './user';
import { protectedResources } from './auth-config';

@Injectable({
    providedIn: 'root'
})
export class GraphService {

    private user: User = {
        displayName: "",
        groupIDs: [],
    };

    uri = protectedResources.apiGraph.endpoint;

    constructor(private http: HttpClient) { }

    getUser() {
        return this.user;
    };

    getGroups() {
        return this.http.get(this.uri);
    };

    setGroups(groups: any) {
        this.user.groupIDs = groups;
    };

    addGroup(group: string) {
        this.user.groupIDs.push(group);
    };

    getNextPage(nextPage: any) {
        return this.http.get(nextPage);
    };
}
