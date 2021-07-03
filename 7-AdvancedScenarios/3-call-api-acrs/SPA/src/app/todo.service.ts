import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators'

import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { AuthenticationResult, EventMessage, EventType, InteractionStatus } from '@azure/msal-browser';

import { Todo } from './todo';
import { protectedResources } from './auth-config';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  url = protectedResources.todoListApi.endpoint;

  constructor(private http: HttpClient, private authService: MsalService, private msalBroadcastService: MsalBroadcastService) { }

  getTodos() {
    return this.http
      .get<Todo[]>(this.url)
      .pipe(catchError(async (error) => {
        console.error(error);
        if (error instanceof HttpErrorResponse) {
          await this.handleClaimsChallenge(error);
        }
        return error;
      }));
  }

  getTodo(id: number) {
    return this.http
      .get<Todo>(this.url + '/' + id)
      .pipe(catchError(async (error) => {
        console.error(error);
        if (error instanceof HttpErrorResponse) {
          await this.handleClaimsChallenge(error);
        }
        return error;
      }));
  }

  postTodo(todo: Todo) {
    return this.http
      .post<Todo>(this.url, todo)
      .pipe(catchError(async (error) => {
        console.error(error);
        if (error instanceof HttpErrorResponse) {
          await this.handleClaimsChallenge(error);
        }
        return error;
      }));
  }

  deleteTodo(id: number) {
    return this.http
      .delete(this.url + '/' + id)
      .pipe(catchError(async (error) => {
        console.error(error);
        if (error instanceof HttpErrorResponse) {
          await this.handleClaimsChallenge(error);
        }
        return error;
      }))
  }

  editTodo(todo: Todo) {
    return this.http
      .put<Todo>(this.url + '/' + todo.id, todo)
      .pipe(catchError(async (error) => {
        console.error(error);
        if (error instanceof HttpErrorResponse) {
          await this.handleClaimsChallenge(error);
        }
        return error;
      }));
  }

  async handleClaimsChallenge(response: HttpErrorResponse): Promise<void> {
    if (response.status === 401) {
      if (response.headers.get('www-authenticate')) {
        const authenticateHeader = response.headers.get("www-authenticate")!;

        const claimsChallenge = authenticateHeader.split(" ")
          .find((entry: string) => entry.includes("claims="))!.split('="')[1].split('",')[0];

        try {
          await this.authService.acquireTokenPopup({
            claims: window.atob(claimsChallenge),
            scopes: protectedResources.todoListApi.scopes
          });
        } catch (error) {
          console.log(error);
        }

      } else {
        console.log("unknown header");
      }
    }
  }
}
