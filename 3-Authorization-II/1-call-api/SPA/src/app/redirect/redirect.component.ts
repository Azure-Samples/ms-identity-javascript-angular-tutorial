import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-redirect',
    templateUrl: './redirect.component.html',
    styleUrls: ['./redirect.component.css']
})
export class RedirectComponent implements OnInit {

    /**
     * Blank page for redirect purposes. When using popup and silent APIs,
     * we recommend setting the redirectUri to a blank page or a page that does not implement MSAL.
     * For more information, please follow this link:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/login-user.md#redirecturi-considerations
     */

    constructor() { }

    ngOnInit(): void {
    }

}
