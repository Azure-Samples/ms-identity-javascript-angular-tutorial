import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { TodoService } from './../todo.service';
import { Todo } from '../todo';
import { MsalService } from '@azure/msal-angular';

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
        private service: TodoService
    ) { }

    ngOnInit(): void {
        this.getTodos();
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
                this.todos = todos;
            });
    }

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
