import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AccountInfo, AuthenticationResult, InteractionRequiredAuthError, InteractionType, EventType, EventMessage } from "@azure/msal-browser";
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { Client, AuthenticationProvider, AuthenticationProviderOptions } from '@microsoft/microsoft-graph-client';


export interface ProviderOptions extends AuthenticationProviderOptions {
  account: AccountInfo,
  scopes: string[],
  interactionType: InteractionType
}

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  constructor(private authService: MsalService, private msalBroadcastService: MsalBroadcastService) { }

  /**
 * Returns a graph client object with the provided token acquisition options
 * @param {AccountInfo} account: user account object to be used when attempting silent token acquisition  
 * @param {array} scopes: array of scopes required for this resource endpoint
 * @param {InteractionType} interactionType: type of interaction to fallback to when silent token acquisition fails 
 */
  getGraphClient = (providerOptions: ProviderOptions) => {

    /**
     * Pass the instance as authProvider in ClientOptions to instantiate the Client which will create and set the default middleware chain.
     * For more information, visit: https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/dev/docs/CreatingClientInstance.md
     */
    let clientOptions = {
      authProvider: new MyAuthenticationProvider(providerOptions, this.authService, this.msalBroadcastService),
    };

    const graphClient = Client.initWithMiddleware(clientOptions);

    return graphClient;
  }
}

/**
 * This class implements the IAuthenticationProvider interface, which allows a custom auth provider to be
 * used with the Graph client. See: https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/dev/src/IAuthenticationProvider.ts
 */
class MyAuthenticationProvider implements AuthenticationProvider {

  account;
  scopes;
  interactionType;

  private readonly _destroying$ = new Subject<void>();

  constructor(providerOptions: ProviderOptions, private authService: MsalService, private msalBroadcastService: MsalBroadcastService) {
    this.account = providerOptions.account;
    this.scopes = providerOptions.scopes;
    this.interactionType = providerOptions.interactionType;
  }

  /**
   * This method will get called before every request to the ms graph server
   * This should return a Promise that resolves to an accessToken (in case of success) or rejects with error (in case of failure)
   * Basically this method will contain the implementation for getting and refreshing accessTokens
   */
  getAccessToken(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let response: AuthenticationResult;

      try {
        response = await this.authService.instance.acquireTokenSilent({
          account: this.account,
          scopes: this.scopes
        });

        if (response.accessToken) {
          resolve(response.accessToken);
        } else {
          reject(Error('Failed to acquire an access token'));
        }
      } catch (error) {
        // in case if silent token acquisition fails, fallback to an interactive method
        if (error instanceof InteractionRequiredAuthError) {
          switch (this.interactionType) {
            case InteractionType.Popup:
              response = await this.authService.instance.acquireTokenPopup({
                scopes: this.scopes
              });

              if (response.accessToken) {
                resolve(response.accessToken);
              } else {
                reject(Error('Failed to acquire an access token'));
              }

              break;

            case InteractionType.Redirect:
              this.authService.instance.acquireTokenRedirect({
                scopes: this.scopes
              });

              this.msalBroadcastService.msalSubject$.pipe(
                filter((msg: EventMessage) => msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS),
                takeUntil(this._destroying$)
              ).subscribe((result: EventMessage) => {
                response = result.payload as AuthenticationResult;

                if (response.accessToken) {
                  resolve(response.accessToken);
                } else {
                  reject(Error('Failed to acquire an access token'));
                }
              });
              break;

            default:
              break;
          }
        }
      }
    });
  }
}
