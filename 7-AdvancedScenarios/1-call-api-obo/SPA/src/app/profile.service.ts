import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Profile } from './profile';
import { protectedResources } from './auth-config';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  url = protectedResources.profileApi.endpoint;

  constructor(private http: HttpClient) { }

  getProfile(id: string) { 
    return this.http.get<Profile>(this.url + '/' +  id);
  }
  
  postProfile(profile: Profile) { 
    return this.http.post<Profile>(this.url, profile);
  }

  editProfile(profile: Profile) { 
    return this.http.put<Profile>(this.url + '/' + profile.id, profile);
  }
}
