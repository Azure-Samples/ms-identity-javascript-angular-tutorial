import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Todo } from './todo';

import { protectedResources } from './auth-config';

@Injectable({
    providedIn: 'root'
})
export class TodoService {
    constructor(private http: HttpClient) { }

    getTodos() {
        return this.http.get<Todo[]>(protectedResources.todoListApi.endpoint);
    }

    getTodo(id: number) {
        return this.http.get<Todo>(protectedResources.todoListApi.endpoint + '/' + id);
    }

    postTodo(todo: Todo) {
        return this.http.post<Todo>(protectedResources.todoListApi.endpoint, todo);
    }

    deleteTodo(id: number) {
        return this.http.delete(protectedResources.todoListApi.endpoint + '/' + id);
    }

    editTodo(todo: Todo) {
        return this.http.put<Todo>(protectedResources.todoListApi.endpoint + '/' + todo.id, todo);
    }
}
