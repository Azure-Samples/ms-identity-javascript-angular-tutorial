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
        firstLogin: true,
    };

    constructor(private route: ActivatedRoute, private router: Router, private profileService: ProfileService) { }

    ngOnInit(): void {
        this.route.paramMap.subscribe((params) => {
            let id: string = params.get('id')!;

            this.profileService.getProfile(id)
                .subscribe((profile) => {
                    this.profile = profile as Profile;
                })
        })
    }

    editProfile(): void {
        this.profileService.editProfile(this.profile)
            .subscribe(() => {
                this.router.navigate(['/profile-view']);
            })
    }

}
