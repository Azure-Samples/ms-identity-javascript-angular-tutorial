---
page_type: sample
name: Angular single-page application using MSAL Angular to sign-in users with Azure Active Directory and call the Microsoft Graph API
services: ms-identity
languages:
 - TypeScript
products:
 - angular
urlFragment: ms-identity-javascript-angular-tutorial
description: Angular single-page application using MSAL Angular to sign-in users with Azure Active Directory and call the Microsoft Graph API
---

# Angular single-page application using MSAL Angular to sign-in users with Azure Active Directory and call the Microsoft Graph API

* [Overview](#overview)
* [Scenario](#scenario)
* [Contents](#contents)
* [Prerequisites](#prerequisites)
* [Setup the sample](#setup-the-sample)
* [Explore the sample](#explore-the-sample)
* [Troubleshooting](#troubleshooting)
* [About the code](#about-the-code)
* [Next Steps](#next-steps)
* [Contributing](#contributing)
* [Learn More](#learn-more)

## Overview

This sample demonstrates an Angular single-page application (SPA) that lets users sign-in with Azure Active Directory (Azure AD) using the [Microsoft Authentication Library for Angular](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular) (MSAL Angular). In addition, this sample also demonstrates how to use [Microsoft Graph JavaScript SDK](https://github.com/microsoftgraph/msgraph-sdk-javascript) client with MSAL as a custom authentication provider to call the Graph API.

Here you'll learn about [Access Tokens](https://docs.microsoft.com/azure/active-directory/develop/access-tokens), [acquiring a token](https://docs.microsoft.com/azure/active-directory/develop/scenario-spa-acquire-token), [calling a protected web API](https://docs.microsoft.com/azure/active-directory/develop/scenario-spa-call-api), as well as [Dynamic Scopes and Incremental Consent](https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent), **silent token acquisition**, **working with multiple resources** and more.

> :information_source: See the community call: [An introduction to Microsoft Graph for developers](https://www.youtube.com/watch?v=EBbnpFdB92A)

## Scenario

1. The client Angular SPA uses the Microsoft Authentication Library (MSAL) to sign-in and obtain a JWT access token from **Azure AD**.
1. The access token is used as a *bearer* token to authorize the user to call the Microsoft Graph protected by **Azure AD**.

![Overview](./ReadmeFiles/topology.png)

## Contents

| File/folder                     | Description                                                           |
|---------------------------------|-----------------------------------------------------------------------|
| `src/app/auth-config.ts`        | Authentication parameters reside here.                                |
| `src/app/app.module.ts`         | MSAL-Angular configuration parameters reside here.                    |
| `src/app/app-routing.module.ts` | Configure your MSAL-Guard here.                                       |
| `src/app/graph.service.ts`      | class to call graph API.                                              |

## Prerequisites

* [Node.js](https://nodejs.org/en/download/) must be installed to run this sample.
* [Visual Studio Code](https://code.visualstudio.com/download) is recommended for running and editing this sample.
* [VS Code Azure Tools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-node-azure-pack) extension is recommended for interacting with Azure through VS Code Interface.
* A modern web browser. This sample uses **ES6** conventions and will not run on **Internet Explorer**.
* [Angular-CLI](https://cli.angular.io/) must be installed **globally** to run this sample.* An **Azure AD** tenant. For more information, see: [How to get an Azure AD tenant](https://docs.microsoft.com/azure/active-directory/develop/test-setup-environment#get-a-test-tenant)
* A user account in your **Azure AD** tenant. This sample will not work with a **personal Microsoft account**. If you're signed in to the [Azure portal](https://portal.azure.com) with a personal Microsoft account and have not created a user account in your directory before, you will need to create one before proceeding.

## Setup the sample

### Step 1: Clone or download this repository

From your shell or command line:

```console
    git clone https://github.com/Azure-Samples/ms-identity-javascript-angular-tutorial.git
```

or download and extract the repository *.zip* file.

> :warning: To avoid path length limitations on Windows, we recommend cloning into a directory near the root of your drive.

### Step 2: Install project dependencies

```console
    cd ms-identity-javascript-angular-tutorial
    cd 2-Authorization-I/1-call-graph/SPA
    npm install
```

### Step 3: Register the sample application(s) in your tenant

There is one project in this sample. To register it, you can:

* follow the steps below for manually register your apps
* or use PowerShell scripts that:
  * **automatically** creates the Azure AD applications and related objects (passwords, permissions, dependencies) for you.
  * modify the projects' configuration files.

  <details>
   <summary>Expand this section if you want to use this automation:</summary>

    > :warning: If you have never used **Microsoft Graph PowerShell** before, we recommend you go through the [App Creation Scripts Guide](./AppCreationScripts/AppCreationScripts.md) once to ensure that your environment is prepared correctly for this step.
  
    1. On Windows, run PowerShell as **Administrator** and navigate to the root of the cloned directory
    1. In PowerShell run:

       ```PowerShell
       Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
       ```

    1. Run the script to create your Azure AD application and configure the code of the sample application accordingly.
    1. For interactive process -in PowerShell, run:

       ```PowerShell
       cd .\AppCreationScripts\
       .\Configure.ps1 -TenantId "[Optional] - your tenant id" -AzureEnvironmentName "[Optional] - Azure environment, defaults to 'Global'"
       ```

    > Other ways of running the scripts are described in [App Creation Scripts guide](./AppCreationScripts/AppCreationScripts.md). The scripts also provide a guide to automated application registration, configuration and removal which can help in your CI/CD scenarios.

  </details>

#### Choose the Azure AD tenant where you want to create your applications

To manually register the apps, as a first step you'll need to:

1. Sign in to the [Azure portal](https://portal.azure.com).
1. If your account is present in more than one Azure AD tenant, select your profile at the top right corner in the menu on top of the page, and then **switch directory** to change your portal session to the desired Azure AD tenant.

#### Register the spa app (msal-angular-spa)

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure Active Directory** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
    1. In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-angular-spa`.
    1. Under **Supported account types**, select **Accounts in this organizational directory only**
    1. Select **Register** to create the application.
1. In the **Overview** blade, find and note the **Application (client) ID**. You use this value in your app's configuration file(s) later in your code.
1. Since this app signs-in users, we will now proceed to select **delegated permissions**, which is is required by apps signing-in users.
   1. In the app's registration screen, select the **API permissions** blade in the left to open the page where we add access to the APIs that your application needs:
   1. Select the **Add a permission** button and then:

   1. Ensure that the **Microsoft APIs** tab is selected.
   1. In the *Commonly used Microsoft APIs* section, select **Microsoft Graph**
   1. In the **Delegated permissions** section, select the **User.Read** in the list. Use the search box if necessary.
   1. Select the **Add permissions** button at the bottom.
   1. Select the **Add a permission** button and then:

   1. Ensure that the **Microsoft APIs** tab is selected.
   1. In the list of APIs, select the API `Windows Azure Service Management API`.
   1. In the **Delegated permissions** section, select the **user_impersonation** in the list. Use the search box if necessary.
   1. Select the **Add permissions** button at the bottom.

##### Configure the spa app (msal-angular-spa) to use your app registration

Open the project in your IDE (like Visual Studio or Visual Studio Code) to configure the code.

> In the steps below, "ClientID" is the same as "Application ID" or "AppId".

1. Open the `SPA\src\app\auth-config.ts` file.
1. Find the key `Enter_the_Application_Id_Here` and replace the existing value with the application ID (clientId) of `msal-angular-spa` app copied from the Azure portal.
1. Find the key `Enter_the_Tenant_Info_Here` and replace the existing value with your Azure AD tenant ID.

### Step 4: Running the sample

From your shell or command line, execute the following commands:

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

## We'd love your feedback

Were we successful in addressing your learning objective? Consider taking a moment to [share your experience with us](https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR73pcsbpbxNJuZCMKN0lURpUOU5PNlM4MzRRV0lETkk2ODBPT0NBTEY5MCQlQCN0PWcu).

## Troubleshooting

<details>
 <summary>Expand for troubleshooting info</summary>

> * Use [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) to get support from the community.
Ask your questions on Stack Overflow first and browse existing issues to see if someone has asked your question before.
Make sure that your questions or comments are tagged with [`azure-active-directory` `angular` `ms-identity` `adal` `msal`].

If you find a bug in the sample, raise the issue on [GitHub Issues](../../../../issues).
</details>

## About the code

### Protected resources and scopes

In order to access a protected resource on behalf of a signed-in user, the app needs to present a valid **Access Token** to that resource owner (in this case, Microsoft Graph). **Access Token** requests in **MSAL** are meant to be *per-resource-per-scope(s)*. This means that an **Access Token** requested for resource **A** with scope `scp1`:

* cannot be used for accessing resource **A** with scope `scp2`, and,
* cannot be used for accessing resource **B** of any scope.

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

### Handle Continuous Access Evaluation (CAE) challenge from Microsoft Graph

Continuous access evaluation (CAE) enables applications to do just-in time token validation, for instance enforcing user session revocation in the case of password change/reset but there are other benefits. For details, see [Continuous access evaluation](https://docs.microsoft.com/azure/active-directory/conditional-access/concept-continuous-access-evaluation).

Microsoft Graph is now CAE-enabled in Preview. This means that it can ask its client apps for more claims when conditional access policies require it. Your can enable your application to be ready to consume CAE-enabled APIs by:

1. Declaring that the client app is capable of handling claims challenges.
1. Processing these challenges when they are thrown by the web API.

#### Declare the CAE capability in the configuration

This sample app declares that it's CAE-capable by adding the `clientCapabilities` property in the configuration in `auth-config.ts`:

```javascript
    const msalConfig = {
        auth: {
            clientId: 'Enter_the_Application_Id_Here', 
            authority: 'https://login.microsoftonline.com/Enter_the_Tenant_Info_Here',
            redirectUri: "/", 
            postLogoutRedirectUri: "/",
            navigateToLoginRequestUrl: true, 
            clientCapabilities: ["CP1"] // this lets the resource owner know that this client is capable of handling claims challenge.
        }
    }

    const msalInstance = new PublicClientApplication(msalConfig);
```

#### Processing the CAE challenge from Microsoft Graph

Once the client app receives the CAE claims challenge from Microsoft Graph, it needs to present the user with a prompt for satisfying the challenge via Azure AD authorization endpoint. To do so, we use MSAL's `acquireTokenRedirect` API and provide the claims challenge as a parameter in the token request. This is shown in [graph.service.ts](../SPA/src/app/graph.service.ts), where we handle the response from the Microsoft Graph API with the `handleClaimsChallenge` method:

```typescript
 handleClaimsChallenge(response: any): void {
    if (response.headers.get('www-authenticate')) {
      const authenticateHeader: string =
        response.headers.get('www-authenticate');
      const claimsChallenge: any = authenticateHeader
        ?.split(' ')
        ?.find((entry) => entry.includes('claims='))
        ?.split('claims="')[1]
        ?.split('",')[0];
      let account: any = this.authService.instance.getActiveAccount();
      addClaimsToStorage(
        claimsChallenge,
        `cc.${msalConfig.auth.clientId}.${account?.idTokenClaims?.oid}.${protectedResources.graphMe.resource}`
      );

      this.getAccessTokenInteractively();
    }
  }
```

After that, we require a new access token via the `acquireTokenRedirect` API, fetch the claims challenge from the browser's localStorage, and pass it to the `acquireTokenRedirect` hook in the request parameter.

```typescript
 getAccessTokenInteractively(): void {
    this.authService.instance.acquireTokenRedirect({
      account: this.authService.instance.getActiveAccount()!,
      scopes: protectedResources.graphMe.scopes,
      claims:
        this.authService.instance.getActiveAccount()! &&
        getClaimsFromStorage(
          `cc.${msalConfig.auth.clientId}.${
            this.authService.instance.getActiveAccount()?.idTokenClaims?.oid
          }.${protectedResources.graphMe.resource}`
        )
          ? window.atob(
              getClaimsFromStorage(
                `cc.${msalConfig.auth.clientId}.${
                  this.authService.instance.getActiveAccount()?.idTokenClaims
                    ?.oid
                }.${protectedResources.graphMe.resource}`
              )
            )
          : '',
    });
  }
```

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

Using the httpClient , simply add the Authorization header to your request, followed by the access token you have obtained previously for this resource/endpoint (as a bearer token):

```typescript
getData(endpoint: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(endpoint).subscribe(
        (response: any) => {
          resolve(response);
        },
        (error: any) => {
          if (error.status === 401) {
            this.handleClaimsChallenge(error);
          }
          reject(error);
        }
      );
    });
  }
```

## Next Steps

Learn how to:

* [Use MSAL Angular to sign-in users with Azure Active Directory and call a .NET Core web API](https://github.com/Azure-Samples/ms-identity-javascript-angular-tutorial/blob/main/3-Authorization-II/1-call-api/README.md)
* [Use MSAL Angular TO authenticate users with Azure AD B2C and calls a protected .NET Core web API](https://github.com/Azure-Samples/ms-identity-javascript-angular-tutorial/blob/main/3-Authorization-II/2-call-api-b2c/README.md)

## Contributing

If you'd like to contribute to this sample, see [CONTRIBUTING.MD](/CONTRIBUTING.md).

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information, see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Learn More

* [Microsoft identity platform (Azure Active Directory for developers)](https://docs.microsoft.com/azure/active-directory/develop/)
* [Overview of Microsoft Authentication Library (MSAL)](https://docs.microsoft.com/azure/active-directory/develop/msal-overview)
* [Register an application with the Microsoft identity platform](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app)
* [Configure a client application to access web APIs](https://docs.microsoft.com/azure/active-directory/develop/quickstart-configure-app-access-web-apis)
* [Understanding Azure AD application consent experiences](https://docs.microsoft.com/azure/active-directory/develop/application-consent-experience)
* [Understand user and admin consent](https://docs.microsoft.com/azure/active-directory/develop/howto-convert-app-to-be-multi-tenant#understand-user-and-admin-consent)
* [Application and service principal objects in Azure Active Directory](https://docs.microsoft.com/azure/active-directory/develop/app-objects-and-service-principals)
* [Authentication Scenarios for Azure AD](https://docs.microsoft.com/azure/active-directory/develop/authentication-flows-app-scenarios)
* [Building Zero Trust ready apps](https://aka.ms/ztdevsession)
* [National Clouds](https://docs.microsoft.com/azure/active-directory/develop/authentication-national-cloud#app-registration-endpoints)
* [Azure AD code samples](https://docs.microsoft.com/azure/active-directory/develop/sample-v2-code)
* [Initialize client applications using MSAL.js](https://docs.microsoft.com/azure/active-directory/develop/msal-js-initializing-client-applications)
* [Single sign-on with MSAL.js](https://docs.microsoft.com/azure/active-directory/develop/msal-js-sso)
* [Handle MSAL.js exceptions and errors](https://docs.microsoft.com/azure/active-directory/develop/msal-handling-exceptions?tabs=javascript)
* [Logging in MSAL.js applications](https://docs.microsoft.com/azure/active-directory/develop/msal-logging?tabs=javascript)
* [Pass custom state in authentication requests using MSAL.js](https://docs.microsoft.com/azure/active-directory/develop/msal-js-pass-custom-state-authentication-request)
* [Prompt behavior in MSAL.js interactive requests](https://docs.microsoft.com/azure/active-directory/develop/msal-js-prompt-behavior)
* [Use MSAL.js to work with Azure AD B2C](https://docs.microsoft.com/azure/active-directory/develop/msal-b2c-overview)