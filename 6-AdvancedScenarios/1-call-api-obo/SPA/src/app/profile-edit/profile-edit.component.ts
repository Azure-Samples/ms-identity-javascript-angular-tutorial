import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ProfileService } from '../profile.service';
import { Profile } from '../profile';

@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css']
})
export class ProfileEditComponent implements OnInit {

  profile: Profile = {
    id: "",
    userPrincipalName: "",
    givenName: "",
    surname: "",
    jobTitle: "",
    mobilePhone: "",
    preferredLanguage: "",
    firstLogin: true,
  };

  constructor(private route: ActivatedRoute, private router: Router, private profileService: ProfileService) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      let id: string = params.get('id')!;

      this.profileService.getProfile(id)
        .subscribe((profile: Profile) => {
          this.profile = profile;
        })
    })
  }

  editProfile(profile: Profile): void {
    this.profileService.editProfile(this.profile)
      .subscribe((ex) => {
        console.log(ex)
        this.router.navigate(['/profile-view']);
      })
  }

}
