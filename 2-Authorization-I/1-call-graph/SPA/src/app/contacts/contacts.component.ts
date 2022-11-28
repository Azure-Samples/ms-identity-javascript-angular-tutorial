import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { InteractionType } from '@azure/msal-browser';
import { ResponseType } from '@microsoft/microsoft-graph-client';

import { GraphService, ProviderOptions } from '../graph.service';
import { protectedResources } from '../auth-config';
import { Contact } from '../contacts';

@Component({
    selector: 'app-contacts',
    templateUrl: './contacts.component.html',
    styleUrls: ['./contacts.component.css'],
})
export class ContactsComponent implements OnInit {
    contacts: Contact[] = [];
    hasContacts: boolean = false;

    constructor(
        private graphService: GraphService,
        private authService: MsalService
    ) { }

    ngOnInit(): void {
        const providerOptions: ProviderOptions = {
            account: this.authService.instance.getActiveAccount()!,
            scopes: protectedResources.graphContacts.scopes,
            interactionType: InteractionType.Redirect,
            endpoint: protectedResources.graphContacts.endpoint,
        };

        this.getContacts(providerOptions);
    }

    getContacts(providerOptions: ProviderOptions) {
        this.graphService
            .getGraphClient(providerOptions)
            .api('/me/contacts')
            .responseType(ResponseType.RAW)
            .get()
            .then((response: any) => {
                if (response.status === 200) return response.json();
                if (response.status === 401) {
                    if (response.headers.get('WWW-Authenticate')) {
                        this.graphService.handleClaimsChallenge(response, providerOptions);
                    }
                }
            })
            .then((contactsResponse: any) => {
                this.contacts = contactsResponse.value;
                this.setHasContacts();
            })
            .catch((error: any) => {
                console.log(error);
            });
    }

    setHasContacts() {
        this.hasContacts = this.contacts.length > 0;
    }
}
