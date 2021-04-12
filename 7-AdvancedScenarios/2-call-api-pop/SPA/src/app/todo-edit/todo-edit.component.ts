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
    description: "undefined",
    status: false,
  };

  constructor(private route: ActivatedRoute, private router: Router, private service: TodoService) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe({
      next: (params) => {
        console.log(params)
        let id = +params.get('id')!;
        this.service.getTodo(+id).then((observable) => {
          observable.subscribe((todo: Todo) => {
            this.todo = todo;
          })
        });
      }
    })

  }

  editTodo(todo: Todo): void {
    this.todo.description = todo.description;

    this.service.editTodo(this.todo).then((observable) => {
      observable.subscribe(() => {
        this.router.navigate(['/todo-view']);
      })
    })
  }

}
