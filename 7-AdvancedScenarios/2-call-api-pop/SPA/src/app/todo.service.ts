import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { InteractionRequiredAuthError, AuthenticationScheme } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';

import { Todo } from './todo';
import { protectedResources } from './auth-config';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  url = protectedResources.todoListApi.endpoint;

  constructor(private http: HttpClient, private authService: MsalService) { }

  async getToken(method: string, query?: string) {

    const loginRequest = {
      scopes: [...protectedResources.todoListApi.scopes],
      authenticationScheme: AuthenticationScheme.POP,
      resourceRequestMethod: method,
      resourceRequestUri: query ? protectedResources.todoListApi.endpoint + query : protectedResources.todoListApi.endpoint,
    }

    return this.authService.acquireTokenSilent({
      account: this.authService.instance.getActiveAccount() ? this.authService.instance.getActiveAccount()! : this.authService.instance.getAllAccounts()[0]!,
      ...loginRequest,
    }).toPromise()
      .then((result) => {
        return result.accessToken;
      })
      .catch((error) => {
        console.log(error)
        if (InteractionRequiredAuthError.isInteractionRequiredError(error.errorCode)) {
          this.authService.acquireTokenPopup(loginRequest).toPromise().then((result) => {
            return result.accessToken;
          });
        }
      });
  }

  async getTodos() {
    const accessToken = await this.getToken("GET");

    return this.http.get<Todo[]>(this.url, {
      headers: {
        "Authorization": `PoP ${accessToken}`
      },
    });
  }

  async getTodo(id: number) {
    const accessToken = await this.getToken("GET", `/${id}`);

    return this.http.get<Todo>(this.url + '/' + id, {
      headers: {
        "Authorization": `PoP ${accessToken}`
      },
    });
  }

  async postTodo(todo: Todo) {
    const accessToken = await this.getToken("POST");

    return this.http.post<Todo>(this.url, todo, {
      headers: {
        "Authorization": `PoP ${accessToken}`
      },
    });
  }

  async deleteTodo(id: number) {
    const accessToken = await this.getToken("DELETE", `/${id}`);

    return this.http.delete(this.url + '/' + id, {
      headers: {
        "Authorization": `PoP ${accessToken}`
      },
    });
  }

  async editTodo(todo: Todo) {
    const accessToken = await this.getToken("PUT", `/${todo.id}`);

    return this.http.put<Todo>(this.url + '/' + todo.id, todo, {
      headers: {
        "Authorization": `PoP ${accessToken}`
      },
    });
  }
}
