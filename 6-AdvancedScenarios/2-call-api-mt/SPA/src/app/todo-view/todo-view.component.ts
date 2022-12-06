import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { TodoService } from './../todo.service';
import { Todo } from '../todo';
import { MsalService } from '@azure/msal-angular';
import { GraphService, ProviderOptions } from '../graph.service';
import { ResponseType } from '@microsoft/microsoft-graph-client';
import { InteractionType } from '@azure/msal-browser';
import { msalConfig, protectedResources } from '../auth-config';

@Component({
    selector: 'app-todo-view',
    templateUrl: './todo-view.component.html',
    styleUrls: ['./todo-view.component.css']
})
export class TodoViewComponent implements OnInit {

    todo: Todo = {
        id: 1,
        description: "",
        status: false,
        ownerDisplayName: ""
    };

    todos: Todo[] = [];
    assignees: string[] = [];

    displayedColumns = ['status', 'description', 'assignedTo', 'edit', 'remove'];

    constructor(
        private authService: MsalService,
        private service: TodoService,
        private graphService: GraphService
    ) { }

    ngOnInit(): void {
        this.getTodos();
        // this.getUsers();
    }

    shouldDisplayControl(todo: Todo): boolean {
        if (todo.ownerDisplayName === this.authService.instance.getActiveAccount()?.username) {
            return true;
        }

        return false;
    }

    getTodos(): void {
        this.service.getTodos()
            .subscribe((todos: Todo[]) => {
                console.log(todos)
                this.todos = todos;
            });
    }

    // getUsers(): void {
    //     const providerOptions: ProviderOptions = {
    //         account: this.authService.instance.getActiveAccount()!,
    //         scopes: protectedResources.graphApi.scopes,
    //         interactionType: InteractionType.Redirect,
    //         endpoint: protectedResources.graphApi.endpoint,
    //     };

    //     this.graphService.getGraphClient(providerOptions)
    //         .api('/users')
    //         .responseType(ResponseType.RAW)
    //         .get()
    //         .then((response: any) => {
    //             if (response.status === 200) return response.json();
    //             if (response.status === 401) {
    //                 if (response.headers.get('WWW-Authenticate')) {
    //                     this.graphService.handleClaimsChallenge(response, providerOptions);
    //                 }
    //             }
    //         }).then((profileResponse: any) => {
    //             this.assignees = profileResponse.value.map((user: any) => user.displayName);
    //         }).catch((error: any) => {
    //             console.log(error);
    //         });
    // }

    addTodo(add: NgForm): void {
        console.log(add.value)
        this.service.postTodo(add.value).subscribe(() => {
            this.getTodos();
        })
        add.resetForm();
    }

    checkTodo(todo: Todo): void {
        this.service.editTodo(todo).subscribe();
    }

    removeTodo(id: string): void {
        this.service.deleteTodo(+id).subscribe(() => {
            this.getTodos();
        })
    }
}
