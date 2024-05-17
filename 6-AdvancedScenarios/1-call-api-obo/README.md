---
page_type: sample
description: This sample demonstrates an Angular single-page application (SPA) which lets a user authenticate with their Azure AD tenant and obtains an access token to call an ASP.NET Core web API, protected by Azure Active Directory (Azure AD).
languages:
 - typescript
 - csharp
products:
 - azure-active-directory
 - msal-js
 - msal-angular
 - microsoft-identity-web
 - microsoft-authentication-library
 - entra
urlFragment: spa-msal-angular-graph-obo
extensions:
    services: ms-identity
    platform: javascript
    endpoint: AAD v2.0
    level: 300
    client: Angular SPA
    service: .NET Core web API
---

# An Angular single-page application calling an AspNetCore web API which calls the Microsoft Graph API using the on-behalf-of(OBO) flow

* [Overview](#overview)
* [Scenario](#scenario)
* [Prerequisites](#prerequisites)
* [Setup the sample](#setup-the-sample)
* [Explore the sample](#explore-the-sample)
* [Troubleshooting](#troubleshooting)
* [About the code](#about-the-code)
* [Contributing](#contributing)
* [Learn More](#learn-more)

## Overview

This sample demonstrates an Angular single-page application (SPA) which lets a user authenticate with their Azure AD tenant and obtains an [access token](https://aka.ms/access-tokens) to call an ASP.NET Core web API, protected by [Azure Active Directory (Azure AD)](https://azure.microsoft.com/services/active-directory/).
The web API then proceeds to obtain another access token for [Microsoft Graph API](https://developer.microsoft.com/graph) using the [OAuth 2.0 on-behalf-of flow](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-on-behalf-of-flow).
The web API's call to Microsoft Graph is made using the [Microsoft Graph SDK](https://docs.microsoft.com/graph/sdks/sdks-overview).

## Scenario

- The sample implements an **onboarding** scenario where a profile is created for a new user whose fields are pre-populated by the available information about the user on Microsoft Graph.
- The **ProfileSPA** uses [MSAL Angular](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular) to authenticate a user.
- Once the user authenticates, **ProfileSPA** obtains an [access token](https://aka.ms/access-tokens) from Azure AD.
- The access token is then used to authorize the **ProfileAPI**. This access token is also used to obtain another access token to call MS Graph API **on user's behalf**. In order to call MS Graph API, **ProfileAPI** uses the [Microsoft Graph SDK](https://docs.microsoft.com/graph/sdks/sdks-overview).
- To protect its endpoint and accept only the authorized calls, the ProfileAPI uses [Microsoft.Identity.Web](https://github.com/AzureAD/microsoft-identity-web).

![Overview](./ReadmeFiles/topology.png)

## Contents

| File/folder                         | Description                                                |
|-------------------------------------|------------------------------------------------------------|
| `SPA/src/app/auth-config.ts`        | Authentication parameters for SPA project reside here.     |
| `SPA/src/app/app.module.ts`         | MSAL Angular is initialized here.                          |
| `API/ProfileAPI/appsettings.json`   | Authentication parameters for API project reside here.     |
| `API/ProfileAPI/Startup.cs`         | Microsoft.Identity.Web is initialized here.                |
| `API/ProfileAPI/ProfileController.cs` | MVC controller serving API endpoints                     |

## Prerequisites

* Either [Visual Studio](https://visualstudio.microsoft.com/downloads/) or [Visual Studio Code](https://code.visualstudio.com/download) and [.NET Core SDK](https://www.microsoft.com/net/learn/get-started)
* An **Azure AD** tenant. For more information, see: [How to get an Azure AD tenant](https://docs.microsoft.com/azure/active-directory/develop/test-setup-environment#get-a-test-tenant)
* A user account in your **Azure AD** tenant.

>This sample will not work with a **personal Microsoft account**. If you're signed in to the [Azure portal](https://portal.azure.com) with a personal Microsoft account and have not created a user account in your directory before, you will need to create one before proceeding.

## Setup the sample

### Step 1: Clone or download this repository

From your shell or command line:

```console
git clone https://github.com/Azure-Samples/ms-identity-javascript-angular-tutorial.git
```

or download and extract the repository *.zip* file.

> :warning: To avoid path length limitations on Windows, we recommend cloning into a directory near the root of your drive.

### Step 2. Install .NET Core API dependencies

```console
   cd ms-identity-javascript-angular-tutorial
   cd 6-AdvancedScenarios/1-call-api-obo/API/ProfileAPI
   dotnet restore
```

### Step 3. Trust development certificates

```console
   dotnet dev-certs https --clean
   dotnet dev-certs https --trust
```

For more information and potential issues, see: [HTTPS in .NET Core](https://docs.microsoft.com/aspnet/core/security/enforcing-ssl).

### Step 4. Install Angular SPA dependencies

```console
   cd ../../
   cd SPA
   npm install
```

There are two projects in this sample. Each needs to be separately registered in your Azure AD tenant. To register these projects, you can:

- follow the steps below for manually register your apps
- or use PowerShell scripts that:
  - **automatically** creates the Azure AD applications and related objects (passwords, permissions, dependencies) for you.
  - modify the projects' configuration files.

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

#### Register the service app (ProfileAPI)

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure Active Directory** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
   1. In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `ProfileAPI`.
   1. Under **Supported account types**, select **Accounts in this organizational directory only**
   1. Select **Register** to create the application.
1. In the **Overview** blade, find and note the **Application (client) ID**. You use this value in your app's configuration file(s) later in your code.
1. In the app's registration screen, select the **Certificates & secrets** blade in the left to open the page where you can generate secrets and upload certificates.
1. In the **Client secrets** section, select **New client secret**:
   1. Type a key description (for instance `app secret`).
   1. Select one of the available key durations (**6 months**, **12 months** or **Custom**) as per your security posture.
   1. The generated key value will be displayed when you select the **Add** button. Copy and save the generated value for use in later steps.
   1. You'll need this key later in your code's configuration files. This key value will not be displayed again, and is not retrievable by any other means, so make sure to note it from the Azure portal before navigating to any other screen or blade.
   > :bulb: For enhanced security, instead of using client secrets, consider [using certificates](./README-use-certificate.md) and [Azure KeyVault](https://azure.microsoft.com/services/key-vault/#product-overview).
   1. In the app's registration screen, select the **API permissions** blade in the left to open the page where we add access to the APIs that your application needs:
   1. Select the **Add a permission** button and then:
   1. Ensure that the **Microsoft APIs** tab is selected.
   1. In the *Commonly used Microsoft APIs* section, select **Microsoft Graph**
      1. Since this app signs-in users, we will now proceed to select **delegated permissions**, which is requested by apps that signs-in users.
      1. In the **Delegated permissions** section, select **User.Read**, **offline_access** in the list. Use the search box if necessary.
   1. Select the **Add permissions** button at the bottom.
1. In the app's registration screen, select the **Expose an API** blade to the left to open the page where you can publish the permission as an API for which client applications can obtain [access tokens](https://aka.ms/access-tokens) for. The first thing that we need to do is to declare the unique [resource](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow) URI that the clients will be using to obtain access tokens for this API. To declare an resource URI(Application ID URI), follow the following steps:
   1. Select **Set** next to the **Application ID URI** to generate a URI that is unique for this app.
   1. For this sample, accept the proposed Application ID URI (`api://{clientId}`) by selecting **Save**. Read more about Application ID URI at [Validation differences by supported account types \(signInAudience\)](https://docs.microsoft.com/azure/active-directory/develop/supported-accounts-validation).

##### Publish Delegated Permissions

1. All APIs must publish a minimum of one [scope](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow#request-an-authorization-code), also called [Delegated Permission](https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#permission-types), for the client apps to obtain an access token for a *user* successfully. To publish a scope, follow these steps:
1. Select **Add a scope** button open the **Add a scope** screen and enter the values as indicated below:
   1. For **Scope name**, use `access_graph_on_behalf_of_user`.
   1. Select **Admins and users** options for **Who can consent?**.
   1. For **Admin consent display name** type in *Access Microsoft Graph as the signed-in user*.
   1. For **Admin consent description** type in *Allow the app to access Microsoft Graph Api as the signed-in user*.
   1. For **User consent display name** type in *Access Microsoft Graph on your behalf*.
   1. For **User consent description** type in *Allow the Microsoft Graph APi on your behalf.*.
   1. Keep **State** as **Enabled**.
   1. Select the **Add scope** button on the bottom to save this scope.
1. Select the **Manifest** blade on the left.
   1. Set `accessTokenAcceptedVersion` property to **2**.
   1. Select on **Save**.

##### Configure Optional Claims

1. Still on the same app registration, select the **Token configuration** blade to the left.
1. Select **Add optional claim**:
   1. Select **optional claim type**, then choose **Access**.
      1. Select the optional claim **idtyp**.
      > Indicates token type. This claim is the most accurate way for an API to determine if a token is an app token or an app+user token. This is not issued in tokens issued to users.
   1. Select **Add** to save your changes.
1. Still on the same app registration, select the **Manifest** blade to the left.
   1. Set the **optionalClaims** property as shown below to request client capabilities claim *xms_cc*:

   ```json
      "optionalClaims": 
      {
      "accessToken": [
         {
            "additionalProperties": [],
            "essential": false,
            "name": "xms_cc",
            "source": null
         }
      ],
      "idToken": [],
      "saml2Token": []
      }
   ```

##### Configure the service app (ProfileAPI) to use your app registration

Open the project in your IDE (like Visual Studio or Visual Studio Code) to configure the code.

> In the steps below, "ClientID" is the same as "Application ID" or "AppId".

1. Open the `API\ProfileAPI\appsettings.json` file.
1. Find the key `Enter the client Secret` and replace the existing value with the generated secret that you saved during the creation of `ProfileAPI` copied from the Azure portal.
1. Find the key `Enter the client ID (aka 'Application ID')` and replace the existing value with the application ID (clientId) of `ProfileAPI` app copied from the Azure portal.
1. Find the key `Enter the tenant ID` and replace the existing value with your Azure AD tenant/directory ID.

#### Register the client app (ProfileSPA)

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure Active Directory** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
   1. In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `ProfileSPA`.
   1. Under **Supported account types**, select **Accounts in this organizational directory only**
   1. Select **Register** to create the application.
1. In the **Overview** blade, find and note the **Application (client) ID**. You use this value in your app's configuration file(s) later in your code.
1. In the app's registration screen, select the **Authentication** blade to the left.
1. If you don't have a platform added, select **Add a platform** and select the **Single-page application** option.
   1. In the **Redirect URI** section enter the following redirect URIs:
      1. `http://localhost:4200`
      1. `http://localhost:4200/auth`
   1. Click **Save** to save your changes.
1. In the app's registration screen, select the **API permissions** blade in the left to open the page where we add access to the APIs that your application needs:
   1. Select the **Add a permission** button and then:
   1. Ensure that the **My APIs** tab is selected.
   1. In the list of APIs, select the API `ProfileAPI`.
      1. Since this app signs-in users, we will now proceed to select **delegated permissions**, which is requested by apps that signs-in users.
      1. In the **Delegated permissions** section, select **access_graph_on_behalf_of_user** in the list. Use the search box if necessary.
   1. Select the **Add permissions** button at the bottom.

##### Configure Optional Claims

1. Still on the same app registration, select the **Token configuration** blade to the left.
1. Select **Add optional claim**:
   1. Select **optional claim type**, then choose **Access**.
   1. Select the optional claim **acct**.
   > Provides user's account status in tenant. If the user is a **member** of the tenant, the value is *0*. If they're a **guest**, the value is *1*.
   1. Select **Add** to save your changes.

##### Configure the client app (ProfileSPA) to use your app registration

Open the project in your IDE (like Visual Studio or Visual Studio Code) to configure the code.

> In the steps below, "ClientID" is the same as "Application ID" or "AppId".

1. Open the `SPA\src\app\auth-config.ts` file.
1. Find the key `Enter_the_Application_Id_Here` and replace the existing value with the application ID (clientId) of `ProfileSPA` app copied from the Azure portal.
1. Find the key `Enter_the_Tenant_Info_Here` and replace the existing value with your Azure AD tenant/directory ID.
1. Find the key `Enter_the_Web_Api_Application_Id_Here` and replace the existing value with the application ID (clientId) of `ProfileAPI` app copied from the Azure portal.

#### Configure Known Client Applications for service (ProfileAPI)

For a middle-tier web API (`ProfileAPI`) to be able to call a downstream web API, the middle tier app needs to be granted the required permissions as well. However, since the middle-tier cannot interact with the signed-in user, it needs to be explicitly bound to the client app in its **Azure AD** registration. This binding merges the permissions required by both the client and the middle-tier web API and presents it to the end user in a single consent dialog. The user then consent to this combined set of permissions. To achieve this, you need to add the **Application Id** of the client app to the `knownClientApplications` property in the **manifest** of the web API. Here's how:

1. In the [Azure portal](https://portal.azure.com), navigate to your `ProfileAPI` app registration, and select the **Manifest** blade.
1. In the manifest editor, change the `knownClientApplications: []` line so that the array contains the Client ID of the client application (`ProfileSPA`) as an element of the array.

For instance:

```json
   "knownClientApplications": ["Enter_the_Application_Id_Here"],
```

1. **Save** the changes to the manifest.

### Step 5: Running the sample

Using a command line interface such as VS Code integrated terminal, locate the application directory. Then:  

```console
   cd SPA
   npm start
```

In a separate console window, execute the following commands:

```console
   cd API/ProfileAPI
   dotnet run
```

## Explore the sample

1. Open your browser and navigate to `http://localhost:4200`.
2. Sign-in using the button on top-right corner.
3. If this is your first sign-in, you will be redirected to the onboarding page (the app will try to make a **GET** request: if this is the first time, it will fail -this is expected).
4. Hit **Accept** and a new account will be created for you in the database, pre-populated by the information about you fetched from Microsoft Graph.
5. Submit your changes. When you sign-in next time, the application will recognize you and show you the profile associated with your ID in the database.

![Screenshot](./ReadmeFiles/screenshot.png)

> :information_source: Did the sample not work for you as expected? Then please reach out to us using the [GitHub Issues](../../../../issues) page.

## We'd love your feedback!

Were we successful in addressing your learning objective? Consider taking a moment to [share your experience with us](https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR73pcsbpbxNJuZCMKN0lURpUOU5PNlM4MzRRV0lETkk2ODBPT0NBTEY5MCQlQCN0PWcu).

## Troubleshooting

<details>
	<summary>Expand for troubleshooting info</summary>

Use [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) to get support from the community.
Ask your questions on Stack Overflow first and browse existing issues to see if someone has asked your question before.
Make sure that your questions or comments are tagged with [`azure-active-directory` `dotnet` `ms-identity` `adal` `msal`].

If you find a bug in the sample, raise the issue on [GitHub Issues](../../../../issues).

To debug the .NET Core web API that comes with this sample, install the [C# extension](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp) for Visual Studio Code.

Learn more about using [.NET Core with Visual Studio Code](https://docs.microsoft.com/dotnet/core/tutorials/with-visual-studio-code).

To provide feedback on or suggest features for Azure Active Directory, visit [User Voice page](https://feedback.azure.com/d365community/forum/79b1327d-d925-ec11-b6e6-000d3a4f06a4).

</details>

## About the code

### Configuring the middle-tier web API (ProfileAPI)

In [Startup.cs](./API/ProfileAPI/Startup.cs), add services for authentication, token validation, token caching and Graph SDK support using the [Microsoft.Identity.Web](https://github.com/AzureAD/microsoft-identity-web) APIs as shown below:

```csharp
public void ConfigureServices(IServiceCollection services)
      {
         services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
               .AddMicrosoftIdentityWebApi(Configuration)
                  .EnableTokenAcquisitionToCallDownstreamApi()
                     .AddMicrosoftGraph(Configuration.GetSection("DownstreamAPI"))
                     .AddInMemoryTokenCaches();

         services.AddDbContext<ProfileContext>(opt => opt.UseInMemoryDatabase("Profile"));

         services.AddControllers();

         // Allowing CORS for all domains and methods for the purpose of sample
         services.AddCors(o => o.AddPolicy("default", builder =>
         {
               builder.AllowAnyOrigin()
                     .AllowAnyMethod()
                     .AllowAnyHeader()
                     .WithExposedHeaders("WWW-Authenticate");
         }));
      }
```

Notice the [WWW-Authenticate](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate) header exposed in the CORS policy setup. This header tells the client app that authentication is needed for the middle-tier API, as middle-tier API has no user interface and cannot prompt the user itself.

### Gaining consent for the middle-tier web API

The middle-tier application adds the client to the `knownClientApplications` list in its manifest, and then the client app can trigger a combined consent flow for both itself and the middle-tier application. On the Microsoft identity platform, this is done using the `/.default` scope. When triggering a consent screen using known client applications and `/.default`, the consent screen will show permissions for both the client to the middle-tier API, and also request whatever permissions are required by the middle-tier API. The user provides consent for both applications, and then the OBO flow works.

> :information_source: **KnownClientApplications** is an attribute in **application manifest**. It is used for bundling consent if you have a solution that contains two (or more) parts: a client app and a custom web API. If you enter the `appID` (clientID) of the client app into this array, the user will have to consent only once to the client app. Azure AD will know that consenting to the client means implicitly consenting to the web API. It will automatically provision service principals for both the client and web API at the same time. Both the client and the web API app must be registered in the same tenant.

### Handle Continuous Access Evaluation (CAE) challenge from Microsoft Graph

Continuous access evaluation (CAE) enables applications to do just-in time token validation, for instance enforcing user session revocation in the case of password change/reset but there are other benefits. For details, see [Continuous access evaluation](https://docs.microsoft.com/azure/active-directory/conditional-access/concept-continuous-access-evaluation).

Microsoft Graph is now CAE-enabled. This means that it can ask its client apps for more claims when conditional access policies require it. Your can enable your application to be ready to consume CAE-enabled APIs by:

1. Declaring that the client app is capable of handling [claims challenges](https://aka.ms/claimschallenge).
2. Processing the claim challenge when they are thrown by MS Graph Api.

#### Declare the CAE capability in the configuration

The sample SPA (ProfileSPA) declares that it's CAE-capable by adding the `clientCapabilities` property in the configuration in [auth-config.ts](./SPA/src/app/auth-config.ts):

```typescript
export const msalConfig: Configuration = {
   auth: {
      clientId: 'Enter_the_Application_Id_Here', 
      authority: 'https://login.microsoftonline.com/Enter_the_Tenant_Info_Here',
      redirectUri: '/auth', 
      postLogoutRedirectUri: '/',
      clientCapabilities: ['CP1'] // This lets the resource server know that this client can handle claim challenges.
   },
}
```

The middle-tier web API (ProfileAPI) also needs to declare that it's CAE-capable in [appsettings.json](./API/ProfileAPI/appsettings.json):

```json
"AzureAd": {
   "Instance": "https://login.microsoftonline.com/",
   "TenantId": "Enter the tenant ID",
   "ClientId": "Enter the client ID (aka 'Application ID')",
   "ClientSecret": "Enter the client Secret",
   "ClientCapabilities": [ "CP1" ]
},
```

#### Processing the CAE challenge from Microsoft Graph

Once the middle-tier web API (ProfileAPI) app receives the CAE claims challenge from Microsoft Graph, it needs to process the challenge and redirect the user back to Azure AD for re-authorization. However, since the middle-tier web API does not have UI to carry out this, it needs to propagate the error to the client app (ProfileSPA) instead, where it can be handled. This is shown in [ProfileController](./API/ProfileAPI/Controllers/ProfileController.cs):

```csharp
try
{
   User profile = await _graphServiceClient.Me.Request().GetAsync();
}
catch (ServiceException svcex) when (svcex.Message.Contains("Continuous access evaluation resulted in claims challenge"))
{
   if (IsClientCapableofClaimsChallenge(HttpContext))
   {
      // append the WWW-Authenticate header from the Microsoft Graph response to the response to the client app
      // to learn more, visit: https://learn.microsoft.com/azure/active-directory/develop/app-resilience-continuous-access-evaluation?tabs=dotnet
      HttpContext.Response.Headers.Add("WWW-Authenticate", svcex.ResponseHeaders.WwwAuthenticate.ToString());

      return Unauthorized(svcex.RawResponseBody);
   } 
   else
   {
      return Unauthorized("Continuous access evaluation resulted in claims challenge but the client is not capable");
   }
}
```

On the client side, we use MSAL's `acquireToken` API and provide the claims challenge as a parameter in the token request. This is shown in [profile.service.ts](../SPA/src/app/profile.service.ts), where we handle the response from the Microsoft Graph API with the `handleClaimsChallenge` method:

```typescript
handleClaimsChallenge(response: HttpErrorResponse): void {
   const authenticateHeader: string | null = response.headers.get('WWW-Authenticate');
   const claimsChallengeMap = parseChallenges(authenticateHeader!);
   let account: AccountInfo = this.authService.instance.getActiveAccount()!;

   /**
   * This method stores the claim challenge to the session storage in the browser to be used when acquiring a token.
   * To ensure that we are fetching the correct claim from the storage, we are using the clientId
   * of the application and oid (user’s object id) as the key identifier of the claim with schema
   * cc.<clientId>.<oid><resource.hostname>
   */
   addClaimsToStorage(
      `cc.${msalConfig.auth.clientId}.${account?.idTokenClaims?.oid}.${new URL(protectedResources.profileApi.endpoint).hostname}`,
      claimsChallengeMap['claims']
   );

   // make a token request afterwards
   this.authService.instance.acquireTokenPopup({
      account: account,
      scopes: protectedResources.profileApi.scopes,
      claims: claimsChallengeMap['claims']
   }).catch((error) => {
      console.log(error);
   });
}
```

## Contributing

If you'd like to contribute to this sample, see [CONTRIBUTING.MD](/CONTRIBUTING.md).

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information, see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Learn More

* [Microsoft identity platform (Azure Active Directory for developers)](https://docs.microsoft.com/azure/active-directory/develop/)
* [Azure AD code samples](https://docs.microsoft.com/azure/active-directory/develop/sample-v2-code)
* [Overview of Microsoft Authentication Library (MSAL)](https://docs.microsoft.com/azure/active-directory/develop/msal-overview)
* [Register an application with the Microsoft identity platform](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app)
* [Configure a client application to access web APIs](https://docs.microsoft.com/azure/active-directory/develop/quickstart-configure-app-access-web-apis)
* [Understanding Azure AD application consent experiences](https://docs.microsoft.com/azure/active-directory/develop/application-consent-experience)
* [Understand user and admin consent](https://docs.microsoft.com/azure/active-directory/develop/howto-convert-app-to-be-multi-tenant#understand-user-and-admin-consent)
* [Application and service principal objects in Azure Active Directory](https://docs.microsoft.com/azure/active-directory/develop/app-objects-and-service-principals)
* [Authentication Scenarios for Azure AD](https://docs.microsoft.com/azure/active-directory/develop/authentication-flows-app-scenarios)
* [Building Zero Trust ready apps](https://aka.ms/ztdevsession)
* [National Clouds](https://docs.microsoft.com/azure/active-directory/develop/authentication-national-cloud#app-registration-endpoints)
* [Microsoft.Identity.Web](https://aka.ms/microsoft-identity-web)
* [Validating Access Tokens](https://docs.microsoft.com/azure/active-directory/develop/access-tokens#validating-tokens)
* [User and application tokens](https://docs.microsoft.com/azure/active-directory/develop/access-tokens#user-and-application-tokens)
* [Validation differences by supported account types](https://docs.microsoft.com/azure/active-directory/develop/supported-accounts-validation)
* [How to manually validate a JWT access token using the Microsoft identity platform](https://github.com/Azure-Samples/active-directory-dotnet-webapi-manual-jwt-validation/blob/master/README.md)
