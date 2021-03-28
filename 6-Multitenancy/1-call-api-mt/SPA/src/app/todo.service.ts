import { Todo } from './todo';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { protectedResources } from './auth-config';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  apiUri = protectedResources.todoListApi.endpoint;
  graphUri = protectedResources.graphApi.endpoint;

  constructor(private http: HttpClient) { }

  getUsers() {
    return this.http.get<string[]>(this.graphUri);
  }

  getTodos() { 
    return this.http.get<Todo[]>(this.apiUri);
  }

  getTodo(id: number) { 
    return this.http.get<Todo>(this.apiUri + '/' + id);
  }
  
  postTodo(todo: Todo) { 
    return this.http.post<Todo>(this.apiUri, todo);
  }

  deleteTodo(id: number) {
    return this.http.delete(this.apiUri + '/' + id);
  }

  editTodo(todo: Todo) { 
    return this.http.put<Todo>(this.apiUri + '/' + todo.id, todo);
  }
}
