import { Component, OnInit } from '@angular/core';
import { GraphService } from '../graph.service';
import { protectedResources } from '../auth-config';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css'],
})
export class ContactsComponent implements OnInit {
  contacts: any = [];
  hasContacts: boolean = false;
  constructor(private graphService: GraphService) {}

  ngOnInit(): void {
    this.graphService
      .getData(protectedResources.graphContacts.endpoint)
      .then((contactsResponse: any) => {
        this.contacts = contactsResponse.value;
        this.setHasContacts();
      })
      .catch((errorResponse) => {
        if (
          errorResponse.status === 404 &&
          errorResponse.error.error.message ===
            'The mailbox is either inactive, soft-deleted, or is hosted on-premise.'
        ) {
          this.setHasContacts();
        }
      });
  }

  setHasContacts() {
    this.hasContacts = this.contacts.length > 0;
  }
}
