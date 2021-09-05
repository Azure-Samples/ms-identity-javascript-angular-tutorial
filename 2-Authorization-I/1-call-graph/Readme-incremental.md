# Angular single-page application using MSAL Angular to sign-in users with Azure Active Directory and call the Microsoft Graph API

 1. [Overview](#overview)
 1. [Scenario](#scenario)
 1. [Contents](#contents)
 1. [Setup](#setup)
 1. [Registration](#registration)
 1. [Running the sample](#running-the-sample)
 1. [Explore the sample](#explore-the-sample)
 1. [About the code](#about-the-code)
 1. [More information](#more-information)
 1. [Community Help and Support](#community-help-and-support)
 1. [Contributing](#contributing)

## Overview

This sample demonstrates an Angular single-page application (SPA) that lets users sign-in with Azure Active Directory (Azure AD) using the [Microsoft Authentication Library for Angular](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular) (MSAL Angular). In addition, this sample also demonstrates how to use [Microsoft Graph JavaScript SDK](https://github.com/microsoftgraph/msgraph-sdk-javascript) client with MSAL as a custom authentication provider to call the Graph API.

> :information_source: Note that you are not required to implement a custom provider, as the v3.0 (preview) of the SDK offers a [default provider](https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/dev/docs/AuthCodeMSALBrowserAuthenticationProvider.md) that implements MSAL.js.

Here you'll learn about [Access Tokens](https://docs.microsoft.com/azure/active-directory/develop/access-tokens), [acquiring a token](https://docs.microsoft.com/azure/active-directory/develop/scenario-spa-acquire-token), [calling a protected web API](https://docs.microsoft.com/azure/active-directory/develop/scenario-spa-call-api), as well as [Dynamic Scopes and Incremental Consent](https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent), **silent token acquisition**, **working with multiple resources** and more.

## Scenario

1. The client Angular SPA uses **MSAL Angular** to sign-in and obtain a JWT access token from **Azure AD**.
2. The access token is used as a *bearer token* to authorize the user to call the Microsoft Graph protected **Azure AD**.

![Overview](./ReadmeFiles/topology.png)

## Contents

| File/folder                     | Description                                                           |
|---------------------------------|-----------------------------------------------------------------------|
| `src/app/auth-config.ts`        | Authentication parameters reside here.                                |
| `src/app/app.module.ts`         | MSAL-Angular configuration parameters reside here.                    |
| `src/app/app-routing.module.ts` | Configure your MSAL-Guard here.                                       |
| `src/app/graph.service.ts`      | Instantiates Graph SDK client using a custom authentication provider. |

## Setup

Install project dependencies:

```console
    cd ms-identity-javascript-angular-tutorial
    cd 2-Authorization-I/1-call-graph/SPA
    npm install
```

## Registration

There is one project in this sample. To register it, you can:

- follow the steps below for manually register your apps
- or use PowerShell scripts that:
  - **automatically** creates the Azure AD applications and related objects (passwords, permissions, dependencies) for you.
  - modify the projects' configuration files.

<details>
  <summary>Expand this section if you want to use this automation:</summary>

> :warning: If you have never used **Azure AD Powershell** before, we recommend you go through the [App Creation Scripts](./AppCreationScripts/AppCreationScripts.md) once to ensure that your environment is prepared correctly for this step.

1. On Windows, run PowerShell as **Administrator** and navigate to the root of the cloned directory
1. If you have never used Azure AD Powershell before, we recommend you go through the [App Creation Scripts](./AppCreationScripts/AppCreationScripts.md) once to ensure that your environment is prepared correctly for this step.
1. In PowerShell run:

   ```PowerShell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
   ```

1. Run the script to create your Azure AD application and configure the code of the sample application accordingly.
1. In PowerShell run:

   ```PowerShell
   cd .\AppCreationScripts\
   .\Configure.ps1
   ```

   > Other ways of running the scripts are described in [App Creation Scripts](./AppCreationScripts/AppCreationScripts.md)
   > The scripts also provide a guide to automated application registration, configuration and removal which can help in your CI/CD scenarios.

</details>

### Update the app registration (msal-angular-spa)

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure AD** service.
1. Select the **App Registrations** blade on the left, then find and select the application that you have registered in the previous tutorial (`msal-angular-spa`).
1. In the app's registration screen, select the **API permissions** blade in the left to open the page where we add access to the APIs that your application needs.
   - Select the **Add a permission** button and then,
   - Ensure that the **Microsoft APIs** tab is selected.
   - In the *Commonly used Microsoft APIs* section, select **Microsoft Graph**
   - In the **Delegated permissions** section, select the **User.Read** in the list. Use the search box if necessary.
   - Select the **Add permissions** button at the bottom.
1. Still in the **API permissions** blade,
   - Select the **Add a permission** button and then,
   - Ensure that the **Microsoft APIs** tab is selected.
   - In the *Commonly used Microsoft APIs* section, select **Azure Service Management**
   - In the **Delegated permissions** section, select the **user_impersonation** in the list. Use the search box if necessary.
   - Select the **Add permissions** button at the bottom.

#### Configure the app (msal-angular-spa) to use your app registration

Open the project in your IDE (like Visual Studio or Visual Studio Code) to configure the code.

> In the steps below, "ClientID" is the same as "Application ID" or "AppId".

1. Open the `SPA\src\app\auth-config.ts` file.
1. Find the key `Enter_the_Application_Id_Here` and replace the existing value with the application ID (clientId) of `msal-angular-spa` app copied from the Azure portal.
1. Find the key `Enter_the_Tenant_Info_Here` and replace the existing value with your Azure AD tenant name.

## Running the sample

```console
    cd 2-Authorization-I/1-call-graph/SPA
    npm start
```

## Explore the sample

1. Open your browser and navigate to `http://localhost:4200`.
1. Click the **sign-in** button on the top right corner.
1. Once you authenticate, click the **Call API** button at the center.

![Screenshot](./ReadmeFiles/screenshot.png)

> :information_source: Did the sample not work for you as expected? Then please reach out to us using the [GitHub Issues](../../../../issues) page.

## We'd love your feedback!

Were we successful in addressing your learning objective? Consider taking a moment to [share your experience with us](https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR73pcsbpbxNJuZCMKN0lURpUOU5PNlM4MzRRV0lETkk2ODBPT0NBTEY5MCQlQCN0PWcu).

## About the code

### Protected resources and scopes

In order to access a protected resource on behalf of a signed-in user, the app needs to present a valid **Access Token** to that resource owner (in this case, Microsoft Graph). **Access Token** requests in **MSAL** are meant to be *per-resource-per-scope(s)*. This means that an **Access Token** requested for resource **A** with scope `scp1`:

- cannot be used for accessing resource **A** with scope `scp2`, and,
- cannot be used for accessing resource **B** of any scope.

The intended recipient of an **Access Token** is represented by the `aud` claim (in this case, it should be the Microsoft Graph API's App ID); in case the value for the `aud` claim does not mach the resource **APP ID URI**, the token should be considered invalid. Likewise, the permissions that an **Access Token** grants is represented by the `scp` claim. See [Access Token claims](https://docs.microsoft.com/azure/active-directory/develop/access-tokens#payload-claims) for more information.

MSAL Angular provides the `MsalInterceptor` for obtaining tokens and adding them to HTTP requests. The `protectedResourceMap` is part of the `MsalInterceptorConfiguration` object, initialized in [app.module.ts](./SPA/src/app/app.module.ts).

```typescript
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();

  protectedResourceMap.set("https://graph.microsoft.com/v1.0/me", ["User.Read"]);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}
```

See for more: [FAQ: Using the protectedResourceMap](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/FAQ.md#how-do-i-add-tokens-to-api-calls)

### Acquire a Token

Setting `protectedResourceMap` at app initialization takes care of acquiring tokens and attaching them to HTTP requests. Simply call your API using a HTTP client and MSAL Angular will handle attaching tokens to your call.

```typescript
export class ProfileComponent implements OnInit {
  
  profile!: ProfileType;
  
  constructor(
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.getProfile();
  }

  getProfile() {
    this.http.get("https://graph.microsoft.com/v1.0/me")
      .subscribe((profile: ProfileType) => {
            console.log(profile);
      });
  }
}
```

Alternatively, you can also explicitly acquire tokens using the acquireToken APIs. **MSAL.js** exposes 3 APIs for acquiring a token: `acquireTokenPopup()`, `acquireTokenRedirect()` and `acquireTokenSilent()`. The `acquireTokenSilent()` API is meant to retrieve a non-expired access token from cache *silently*. If `acquireTokenSilent()` fails for some reason, the recommended pattern is to fallback to one of the interactive methods i.e. `acquireTokenPopup()` or `acquireTokenRedirect()`. `acquireTokenSilent()` requires the current user's account as a parameter. Read more about [accounts in MSAL Angular](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/FAQ.md#how-do-i-get-accounts).

```typescript
export class AppComponent implements OnInit {

  constructor(
    private authService: MsalService,
  ) {}

  ngOnInit(): void {
    this.authService.acquireTokenSilent({
          account: this.authService.getActiveAccount(), // get the current user's account
          scopes: ["User.Read"]  
      }).subscribe({
        next: (result: AuthenticationResult) => {
          console.log(result);
        }, 
        error: (error) => {
          this.authService.acquireTokenRedirect({
            scopes: ["User.Read"]    
          });
        }
      });
  }
}
```

> :information_source: When using `acquireTokenRedirect`, you may want to set `navigateToLoginRequestUrl` in [msalConfig](./SPA/src/authConfig.js) to **true** if you wish to return back to the page where acquireTokenRedirect was called.

### Working with multiple resources

When you have to access multiple resources, initiate a separate token request for each:

 ```javascript
     // "User.Read" stands as shorthand for "graph.microsoft.com/User.Read"
     const graphToken = await msalInstance.acquireTokenSilent({
          scopes: [ "User.Read" ]
     });
     const customApiToken = await msalInstance.acquireTokenSilent({
          scopes: [ "api://<myCustomApiClientId>/My.Scope" ]
     });
 ```

Bear in mind that you *can* request multiple scopes for the same resource (e.g. `User.Read`, `User.Write` and `Calendar.Read` for **MS Graph API**).

 ```javascript
     const graphToken = await msalInstance.acquireTokenSilent({
          scopes: [ "User.Read", "User.Write", "Calendar.Read"] // all MS Graph API scopes
     });
 ```

In case you *erroneously* pass multiple resources in your token request, the token you will receive will only be issued for the first resource.

 ```javascript
     // you will only receive a token for MS GRAPH API's "User.Read" scope here
     const myToken = await msalInstance.acquireTokenSilent({
          scopes: [ "User.Read", "api://<myCustomApiClientId>/My.Scope" ]
     });
 ```

### Dynamic scopes and incremental consent

In **Azure AD**, the scopes (permissions) set directly on the application registration are called static scopes. Other scopes that are only defined within the code are called dynamic scopes. This has implications on the **login** (i.e. loginPopup, loginRedirect) and **acquireToken** (i.e. `acquireTokenPopup`, `acquireTokenRedirect`, `acquireTokenSilent`) methods of **MSAL.js**. Consider:

```javascript
     const loginRequest = {
          scopes: [ "openid", "profile", "User.Read" ]
     };

     const tokenRequest = {
          scopes: [ "Mail.Read" ]
     };

     // will return an ID Token and an Access Token with scopes: "openid", "profile" and "User.Read"
     msalInstance.loginPopup(loginRequest);

     // will fail and fallback to an interactive method prompting a consent screen
     // after consent, the received token will be issued for "openid", "profile" ,"User.Read" and "Mail.Read" combined
     msalInstance.acquireTokenPopup(tokenRequest);
```

In the code snippet above, the user will be prompted for consent once they authenticate and receive an **ID Token** and an **Access Token** with scope `User.Read`. Later, if they request an **Access Token** for `User.Read`, they will not be asked for consent again (in other words, they can acquire a token *silently*). On the other hand, the user did not consented to `Mail.Read` at the authentication stage. As such, they will be asked for consent when requesting an **Access Token** for that scope. The token received will contain all the previously consented scopes, hence the term *incremental consent*.

### Access Token validation

Clients should treat access tokens as opaque strings, as the contents of the token are intended for the **resource only** (such as a web API or Microsoft Graph). For validation and debugging purposes, developers can decode **JWT**s (*JSON Web Tokens*) using a site like [jwt.ms](https://jwt.ms).

### Calling the Microsoft Graph API

[Microsoft Graph JavaScript SDK](https://github.com/microsoftgraph/msgraph-sdk-javascript) provides various utility methods to query the Graph API. While the SDK has a default authentication provider that can be used in basic scenarios, it can also be extended to use with a custom authentication provider such as MSAL. To do so, we will initialize the Graph SDK client with [clientOptions](https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/dev/docs/CreatingClientInstance.md) method, which contains an `authProvider` object of class **MyAuthenticationProvider** that handles the token acquisition process for the client. We offer this as a service to other components as shown below:

```typescript
export class GraphService {

  constructor(private authService: MsalService) { }

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
```

**MyAuthenticationProvider** class needs to implement the [IAuthenticationProvider](https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/dev/src/IAuthenticationProvider.ts) interface, which can be done as shown below:

```typescript
class MyAuthenticationProvider implements AuthenticationProvider {

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
```

See [graph.service.ts](./SPA/src/app/graph.service.ts). The Graph client then can be used in your components as shown below:

```typescript
    const providerOptions: ProviderOptions = {
      account: this.authService.instance.getActiveAccount()!, 
      scopes: protectedResources.graphMe.scopes, 
      interactionType: InteractionType.Popup
    };

    this.graphService.getGraphClient(providerOptions)
    .api('/me').get()
    .then((profileResponse: ProfileType) => {
        // do something with response
    })
    .catch((error) => {
        // handle errors
    });
```

## Next Tutorial

Continue with the next tutorial: [Protect and call a web API](../../3-Authorization-II/1-call-api/README-incremental.md).

## More information

- [Microsoft identity platform (Azure Active Directory for developers)](https://docs.microsoft.com/azure/active-directory/develop/)
- [Overview of Microsoft Authentication Library (MSAL)](https://docs.microsoft.com/azure/active-directory/develop/msal-overview)
- [Quickstart: Register an application with the Microsoft identity platform](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app)
- [Quickstart: Configure a client application to access web APIs](https://docs.microsoft.com/azure/active-directory/develop/quickstart-configure-app-access-web-apis)
- [Understanding Azure AD application consent experiences](https://docs.microsoft.com/azure/active-directory/develop/application-consent-experience)
- [Understand user and admin consent](https://docs.microsoft.com/azure/active-directory/develop/howto-convert-app-to-be-multi-tenant#understand-user-and-admin-consent)
- [Initialize client applications using MSAL.js](https://docs.microsoft.com/azure/active-directory/develop/msal-js-initializing-client-applications)
- [Single sign-on with MSAL.js](https://docs.microsoft.com/azure/active-directory/develop/msal-js-sso)
- [Handle MSAL.js exceptions and errors](https://docs.microsoft.com/azure/active-directory/develop/msal-handling-exceptions?tabs=javascript)
- [Logging in MSAL.js applications](https://docs.microsoft.com/azure/active-directory/develop/msal-logging?tabs=javascript)
- [Pass custom state in authentication requests using MSAL.js](https://docs.microsoft.com/azure/active-directory/develop/msal-js-pass-custom-state-authentication-request)
- [Prompt behavior in MSAL.js interactive requests](https://docs.microsoft.com/azure/active-directory/develop/msal-js-prompt-behavior)
- [Use MSAL.js to work with Azure AD B2C](https://docs.microsoft.com/azure/active-directory/develop/msal-b2c-overview)

For more information about how OAuth 2.0 protocols work in this scenario and other scenarios, see [Authentication Scenarios for Azure AD](https://docs.microsoft.com/azure/active-directory/develop/authentication-flows-app-scenarios).

## Community Help and Support

Use [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) to get support from the community.
Ask your questions on Stack Overflow first and browse existing issues to see if someone has asked your question before.
Make sure that your questions or comments are tagged with [`azure-active-directory` `azure-ad-b2c` `ms-identity` `adal` `msal`].

If you find a bug in the sample, raise the issue on [GitHub Issues](../../../../issues).

To provide feedback on or suggest features for Azure Active Directory, visit [User Voice page](https://feedback.azure.com/forums/169401-azure-active-directory).

## Contributing

If you'd like to contribute to this sample, see [CONTRIBUTING.MD](/CONTRIBUTING.md).

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information, see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
