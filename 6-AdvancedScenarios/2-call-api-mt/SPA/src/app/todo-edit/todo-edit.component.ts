import { TodoService } from './../todo.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Todo } from '../todo';

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
        private todoService: TodoService
    ) { }

    ngOnInit(): void {
        this.getTodo();
    }

    getTodo(): void {
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
