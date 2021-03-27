import { Component, OnInit } from '@angular/core';
import { TodoService } from './../todo.service';
import { Todo } from '../todo';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  users: string[] = [];
  todos: Todo[] = [];
  table: any = [];

  constructor(private service: TodoService) { }

  ngOnInit(): void {
    this.getAll()
  }

  getAll(): void {
    this.service.getTodos()
    .subscribe((todos: Todo[]) => {
      this.todos = todos;
      this.tabulateTodos(this.todos);
    });
  }

  tabulateTodos(todos: Todo[]): void {
    todos.map((todo) => {
      if (!this.users.includes(todo.owner)) {
        this.users.push(todo.owner)
        this.table.push({"owner": todo.owner, "tasks": todos.filter(t => t.owner === todo.owner && !t.status)})
        console.log(this.table)
      }
    })  
  }
}
