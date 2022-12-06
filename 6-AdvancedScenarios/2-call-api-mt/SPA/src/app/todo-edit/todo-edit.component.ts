import { TodoService } from './../todo.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ResponseType } from '@microsoft/microsoft-graph-client';

import { Todo } from '../todo';
import { GraphService, ProviderOptions } from '../graph.service';
import { protectedResources } from '../auth-config';
import { InteractionType } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';

@Component({
    selector: 'app-todo-edit',
    templateUrl: './todo-edit.component.html',
    styleUrls: ['./todo-edit.component.css']
})
export class TodoEditComponent implements OnInit {

    todo: Todo = {
        id: 1,
        description: "",
        status: false,
        ownerDisplayName: ""
    };

    assignees: string[] = [];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: MsalService,
        private todoService: TodoService,
        private graphService: GraphService
    ) { }

    ngOnInit(): void {

        // const providerOptions: ProviderOptions = {
        //     account: this.authService.instance.getActiveAccount()!,
        //     scopes: protectedResources.graphApi.scopes,
        //     interactionType: InteractionType.Redirect,
        //     endpoint: protectedResources.graphApi.endpoint,
        // };

        // this.graphService.getGraphClient(providerOptions)
        //     .api('/users')
        //     .responseType(ResponseType.RAW)
        //     .get()
        //     .then((response: any) => {
        //         if (response.status === 200) return response.json();
        //         if (response.status === 401) {
        //             if (response.headers.get('WWW-Authenticate')) {
        //                 this.graphService.handleClaimsChallenge(response, providerOptions);
        //             }
        //         }
        //     }).then((profileResponse: any) => {
        //         this.assignees = profileResponse.value.map((user: any) => user.displayName);
        //     }).catch((error: any) => {
        //         console.log(error);
        //     });

        this.route.paramMap.subscribe((params) => {
            let id = +params.get('id')!;
            this.todoService.getTodo(+id).subscribe((response: Todo) => {
                this.todo = response;
            })
        })
    }

    editTodo(todo: Todo): void {
        this.todo.description = todo.description;
        this.todoService.editTodo(this.todo).subscribe(() => {
            this.router.navigate(['/todo-view']);
        })
    }

}
