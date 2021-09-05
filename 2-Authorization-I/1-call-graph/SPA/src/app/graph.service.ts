import { Injectable } from '@angular/core';
import { AccountInfo, AuthenticationResult, InteractionRequiredAuthError, InteractionType } from "@azure/msal-browser";
import { MsalService } from '@azure/msal-angular';
import { Client, AuthenticationProvider, AuthenticationProviderOptions } from '@microsoft/microsoft-graph-client';


/**
 * The code below demonstrates how you can use MSAL as a custom authentication provider for the Microsoft Graph JavaScript SDK. 
 * You do NOT need to implement a custom provider. Microsoft Graph JavaScript SDK v3.0 (preview) offers AuthCodeMSALBrowserAuthenticationProvider 
 * which handles token acquisition and renewal for you automatically. For more information on how to use it, visit: 
 * https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/dev/docs/AuthCodeMSALBrowserAuthenticationProvider.md
 */

export interface ProviderOptions extends AuthenticationProviderOptions {
  account: AccountInfo, // user account object to be used when attempting silent token acquisition  
  scopes: string[], // array of scopes required for this resource endpoint
  interactionType: InteractionType // type of interaction to fallback to when silent token acquisition fails 
}

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  constructor(private authService: MsalService) { }

/**
 * Returns a graph client object with the provided token acquisition options
 * @param {ProviderOptions} providerOptions: object containing user account, required scopes and interaction type
 */
  getGraphClient = (providerOptions: ProviderOptions) => {

    /**
     * Pass the instance as authProvider in ClientOptions to instantiate the Client which will create and set the default middleware chain.
     * For more information, visit: https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/dev/docs/CreatingClientInstance.md
     */
    let clientOptions = {
      authProvider: new MsalAuthenticationProvider(providerOptions, this.authService),
    };

    const graphClient = Client.initWithMiddleware(clientOptions);

    return graphClient;
  }
}

/**
 * This class implements the IAuthenticationProvider interface, which allows a custom auth provider to be
 * used with the Graph client. See: https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/dev/src/IAuthenticationProvider.ts
 */
class MsalAuthenticationProvider implements AuthenticationProvider {

  account;
  scopes;
  interactionType;

  constructor(providerOptions: ProviderOptions, private authService: MsalService) {
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
              /**
               * This will cause the app to leave the current page and redirect to the consent screen.
               * Once consent is provided, the app will return back to the current page and then the 
               * silent token acquisition will succeed. 
               */
              this.authService.instance.acquireTokenRedirect({
                scopes: this.scopes
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
