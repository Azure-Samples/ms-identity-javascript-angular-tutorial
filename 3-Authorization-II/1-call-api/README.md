# Angular single-page application using MSAL Angular to sign-in users with Azure Active Directory and call a .NET Core web API

 1. [Overview](#overview)
 1. [Scenario](#scenario)
 1. [Contents](#contents)
 1. [Prerequisites](#prerequisites)
 1. [Setup](#setup)
 1. [Registration](#registration)
 1. [Running the sample](#run-the-sample)
 1. [Explore the sample](#explore-the-sample)
 1. [About the code](#about-the-code)
 1. [More information](#more-information)
 1. [Community Help and Support](#community-help-and-support)
 1. [Contributing](#contributing)

## Overview

This sample demonstrates an Angular single-page application (SPA) calling a ASP.NET Core web API secured with [Azure Active Directory](https://docs.microsoft.com/azure/active-directory/fundamentals/active-directory-whatis) (Azure AD) using the [Microsoft Authentication Library for Angular](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular) (MSAL Angular) for the SPA and the [Microsoft.Identity.Web](https://github.com/AzureAD/microsoft-identity-web) (MIW) for the web API.

## Scenario

1. The client Angular SPA uses **MSAL Angular** to sign-in and obtain a JWT access token from **Azure AD**.
2. The access token is used as a bearer token to authorize the user to call the .NET Core web API protected by **Azure AD**.
3. The web API responds with the currently signed-in user's todolist.

![Topology](./ReadmeFiles/topology.png)

## Contents

| File/folder                         | Description                                                |
|-------------------------------------|------------------------------------------------------------|
| `SPA/src/app/auth-config.ts`        | Authentication parameters for SPA project reside here.     |
| `SPA/src/app/app.module.ts`         | MSAL Angular is initialized here.                          |
| `API/TodoListAPI/appsettings.json`  | Authentication parameters for API project reside here.     |
| `API/TodoListAPI/Startup.cs`        | Microsoft.Identity.Web is initialized here.                |
| `API/TodoListAPI/Controllers/TodoListController.cs` | Contains logic for controlling access to data. |

## Prerequisites

- An **Azure AD** tenant. For more information see: [How to get an Azure AD tenant](https://docs.microsoft.com/azure/active-directory/develop/quickstart-create-new-tenant)
- A user account in your **Azure AD** tenant. This sample will not work with a **personal Microsoft account**. Therefore, if you signed in to the [Azure portal](https://portal.azure.com) with a personal account and have never created a user account in your directory before, you need to do that now.

## Setup

### Step 1. Clone or download this repository

```console
    git clone https://github.com/Azure-Samples/ms-identity-javascript-angular-tutorial.git
```

or download and extract the repository .zip file.

> :warning: To avoid path length limitations on Windows, we recommend cloning into a directory near the root of your drive.

### Step 2. Install .NET Core API dependencies

```console
    cd ms-identity-javascript-angular-tutorial
    cd 3-Authorization-II/1-call-api/API/TodoListAPI
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
    cd ../
    cd SPA
    npm install
```

## Registration

### Register the sample applications with your Azure Active Directory tenant

There are two projects in this sample. Each needs to be separately registered in your Azure AD tenant. To register these projects, you can:

- either follow the steps below for manual registration,
- or use PowerShell scripts that:
  - **automatically** creates the Azure AD applications and related objects (passwords, permissions, dependencies) for you.
  - modify the configuration files.

<details>
  <summary>Expand this section if you want to use this automation:</summary>

> :warning: If you have never used **Microsoft Graph Powershell SDK** before, we recommend you go through the [App Creation Scripts](./AppCreationScripts/AppCreationScripts.md) once to ensure that your environment is prepared correctly for this step.

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

### Register the service app (msal-dotnet-api)

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure AD** service.
1. Select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
   - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-dotnet-api`.
   - Under **Supported account types**, select **Accounts in this organizational directory only**.
1. Select **Register** to create the application.
1. In the app's registration screen, find and note the **Application (client) ID**. You use this value in your app's configuration file(s) later in your code.
1. Select **Save** to save your changes.
1. In the app's registration screen, select the **Expose an API** blade to the left to open the page where you can declare the parameters to expose this app as an API for which client applications can obtain [access tokens](https://docs.microsoft.com/azure/active-directory/develop/access-tokens) for.
The first thing that we need to do is to declare the unique [resource](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow) URI that the clients will be using to obtain access tokens for this Api. To declare an resource URI, follow the following steps:
   - Select `Set` next to the **Application ID URI** to generate a URI that is unique for this app.
   - For this sample, accept the proposed Application ID URI (`api://{clientId}`) by selecting **Save**.
1. All APIs have to publish a minimum of two [scopes](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow#request-an-authorization-code), also called [delegated permissions](https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#permission-types), for the client's to obtain an access token successfully. To publish a scope, follow these steps:
   - Select **Add a scope** button open the **Add a scope** screen and Enter the values as indicated below:
        - For **Scope name**, enter `TodoList.Read`.
        - Select **Admins and users** options for **Who can consent?**.
        - For **Admin consent display name** type `Access msal-dotnet-api`.
        - For **Admin consent description** type `Allows the app to access msal-dotnet-api to read todo list.`
        - For **User consent display name** type `Access msal-dotnet-api`.
        - For **User consent description** type `Allows the app to access msal-dotnet-api to read todo list.`
        - Keep **State** as **Enabled**.
        - Select the **Add scope** button on the bottom to save this scope.
   - Repeat the steps above for publishing another scope named `TodoList.ReadWrite`.
1. APIs should also publish scopes that can only be consumed by applications (not users), also known as [application permissions](https://docs.microsoft.com/azure/active-directory/develop/permissions-consent-overview#types-of-permissions). To do so, select the **App roles** blade to the left.
   - Select **Create app role**:
        - For **Display name**, enter a suitable name, for instance **TodoList.Read.All**.
        - For **Allowed member types**, choose **Application**.
        - For **Value**, enter **TodoList.Read.All**.
        - For **Description**, enter **Application can only read ToDo list**.
        - Select **Apply** to save your changes.
   - Repeat the steps above for permission **TodoList.ReadWrite.All**
1. Select the `Manifest` blade on the left.
   - Set `accessTokenAcceptedVersion` property to **2**.
   - Click on **Save**.

> :information_source: Be aware of [the principle of least privilege](https://docs.microsoft.com/azure/active-directory/develop/secure-least-privileged-access) whenever you are publishing permissions for a web API.

> :information_source: See how to use **application permissions** in a client app here: [.NET Core daemon console application calling a protected web API with its own identity](https://github.com/Azure-Samples/active-directory-dotnetcore-daemon-v2/tree/master/2-Call-OwnApi).

#### Configure the service app (msal-dotnet-api) to use your app registration

Open the project in your IDE to configure the code.
>In the steps below, "ClientID" is the same as "Application ID" or "AppId".

1. Open the `API\TodoListAPI\appsettings.json` file.
1. Find the key `Domain` and replace the existing value with your Azure AD tenant name.
1. Find the key `ClientId` and replace the existing value with the application ID (clientId) of `msal-dotnet-api` app copied from the Azure portal.
1. Find the key `TenantId` and replace the existing value with your Azure AD tenant ID.

### Register the client app (msal-angular-spa)

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure AD** service.
1. Select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
   - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-angular-spa`.
   - Under **Supported account types**, select **Accounts in this organizational directory only**.
   - In the **Redirect URI (optional)** section, select **Single-page application** in the combo-box and enter the following redirect URI: `http://localhost:4200/`.
1. Select **Register** to create the application.
1. In the app's registration screen, find and note the **Application (client) ID**. You use this value in your app's configuration file(s) later in your code.
1. In the app's registration screen, select the **API permissions** blade in the left to open the page where we add access to the APIs that your application needs.
   - Select the **Add a permission** button and then,
     - Ensure that the **My APIs** tab is selected.
     - In the list of APIs, select the API `msal-dotnet-api`.
     - In the **Delegated permissions** section, select the **TodoList.Read** and **TodoList.ReadWrite** in the list. Use the search box if necessary.
     - Select the **Add permissions** button at the bottom.

#### Configure the client app (msal-angular-spa) to use your app registration

Open the project in your IDE to configure the code.
>In the steps below, "ClientID" is the same as "Application ID" or "AppId".

1. Open the `SPA\src\app\auth-config.ts` file.
1. Find the key `Enter_the_Application_Id_Here` and replace the existing value with the application ID (clientId) of `msal-angular-spa` app copied from the Azure portal.
1. Find the key `Enter_the_Tenant_Info_Here` and replace the existing value with your Azure AD tenant ID.
1. Find the key `Enter_the_Web_Api_Application_Id_Here` and replace the existing value with APP ID URI of the web API project that you've registered earlier, e.g. `api://<msal-dotnet-api-client-id>/TodoList.Read`

## Run the sample

Using a command line interface such as VS Code integrated terminal, locate the application directory. Then:  

```console
    cd SPA
    npm start
```

In a separate console window, execute the following commands:

```console
    cd API\TodoListAPI
    dotnet run
```

## Explore the sample

1. Open your browser and navigate to `http://localhost:4200`.
1. Select the **Sign In** button on the top right corner. Choose either **Popup** or **Redirect** flows.
1. Select the **Todolist** button on the navigation bar. This will make a call to the TodoList web API.

> :information_source: Did the sample not work for you as expected? Then please reach out to us using the [GitHub Issues](../../../issues) page.

## We'd love your feedback!

Were we successful in addressing your learning objective? Consider taking a moment to [share your experience with us](https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR73pcsbpbxNJuZCMKN0lURpUOU5PNlM4MzRRV0lETkk2ODBPT0NBTEY5MCQlQCN0PWcu).

## About the code

### CORS settings

You need to set **CORS** policy to be able to call the **TodoListAPI** in [Startup.cs](./API/TodoListAPI/Startup.cs). For the purpose of the sample, **cross-origin resource sharing** (CORS) is enabled for **all** domains and methods. This is insecure and only used for demonstration purposes here. In production, you should modify this as to allow only the domains that you designate. If your web API is going to be hosted on **Azure App Service**, we recommend configuring CORS on the App Service itself.

```csharp
public void ConfigureServices(IServiceCollection services)
{
    // ...

    services.AddCors(o => o.AddPolicy("default", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    }));
}
```

### Access token validation

On the web API side, the `AddMicrosoftIdentityWebApiAuthentication` method in [Startup.cs](./API/TodoListAPI/Startup.cs) protects the web API by [validating access tokens](https://docs.microsoft.com/azure/active-directory/develop/access-tokens#validating-tokens) sent tho this API. Check out [Protected web API: Code configuration](https://docs.microsoft.com/azure/active-directory/develop/scenario-protected-web-api-app-configuration) which explains the inner workings of this method in more detail. Simply add the following line under the `ConfigureServices` method:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    // This is required to be instantiated before the OpenIdConnectOptions starts getting configured.
    // By default, the claims mapping will map claim names in the old format to accommodate older SAML applications.
    // 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role' instead of 'roles'
    // This flag ensures that the ClaimsIdentity claims collection will be built from the claims in the token
    JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

    // Adds Microsoft Identity platform (AAD v2.0) support to protect this Api
    services.AddMicrosoftIdentityWebApiAuthentication(Configuration);

    // ...
}
```

For validation and debugging purposes, developers can decode **JWT**s (*JSON Web Tokens*) using [jwt.ms](https://jwt.ms).

### Verifying permissions

Access tokens that have neither the **scp** (for delegated permissions) nor **roles** (for application permissions) claim with the required scopes/permissions should not be accepted. In the sample, this is illustrated via the `RequiredScopeOrAppPermission` attribute in [TodoListController.cs](./API/TodoListAPI/Controllers/TodoListController.cs):

```csharp
[HttpGet]
/// <summary>
/// Access tokens that have neither the 'scp' (for delegated permissions) nor
/// 'roles' (for application permissions) claim are not to be honored.
///
/// An access token issued by Azure AD will have at least one of the two claims. Access tokens
/// issued to a user will have the 'scp' claim. Access tokens issued to an application will have
/// the roles claim. Access tokens that contain both claims are issued only to users, where the scp
/// claim designates the delegated permissions, while the roles claim designates the user's role.
///
/// To determine whether an access token was issued to a user (i.e delegated) or an application
/// more easily, we recommend enabling the optional claim 'idtyp'. For more information, see:
/// https://docs.microsoft.com/azure/active-directory/develop/access-tokens#user-and-application-tokens
/// </summary>
[RequiredScopeOrAppPermission(
    AcceptedScope = new string[] { _todoListRead, _todoListReadWrite },
    AcceptedAppPermission = new string[] { _todoListReadAll, _todoListReadWriteAll }
)]
public async Task<ActionResult<IEnumerable<TodoItem>>> GetTodoItems()
{
    // route logic ...
}
```

### Access to data

Web API endpoints should be prepared to accept calls from both users and applications, and should have control structures in place to respond to each accordingly. For instance, a call from a user via delegated permissions should be responded with user's data, while a call from an application via application permissions might be responded with the entire todolist. This is illustrated in the [TodoListController](./API/TodoListAPI/Controllers/TodoListController.cs) controller:

```csharp
public async Task<ActionResult<IEnumerable<TodoItem>>> GetTodoItems()
{
    if (HasDelegatedPermissions(new string[] { _todoListRead, _todoListReadWrite }))
    {
        /// <summary>
        /// The 'oid' (object id) is the only claim that should be used to uniquely identify
        /// a user in an Azure AD tenant. The token might have one or more of the following claim,
        /// that might seem like a unique identifier, but is not and should not be used as such:
        ///
        /// - upn (user principal name): might be unique amongst the active set of users in a tenant
        /// but tend to get reassigned to new employees as employees leave the organization and others
        /// take their place or might change to reflect a personal change like marriage.
        ///
        /// - email: might be unique amongst the active set of users in a tenant but tend to get reassigned
        /// to new employees as employees leave the organization and others take their place.
        /// </summary>
        return await _context.TodoItems.Where(x => x.Owner == HttpContext.User.GetObjectId()).ToListAsync();
    }
    else if (HasApplicationPermissions(new string[] { _todoListReadAll, _todoListReadWriteAll }))
    {
        return await _context.TodoItems.ToListAsync();
    }
    
    return null;
}

// Checks if the presented token has application permissions
private bool HasApplicationPermissions(string[] permissionsNames)
{
    var rolesClaim = User.Claims.Where(
    c => c.Type == ClaimConstants.Roles || c.Type == ClaimConstants.Role)
    .SelectMany(c => c.Value.Split(' '));

    var result = rolesClaim.Any(v => permissionsNames.Any(p => p.Equals(v)));

    return result;
}

// Checks if the presented token has delegated permissions
private bool HasDelegatedPermissions(string[] scopesNames)
{
    var result = (User.FindFirst(ClaimConstants.Scp) ?? User.FindFirst(ClaimConstants.Scope))?
        .Value.Split(' ').Any(v => scopesNames.Any(s => s.Equals(v)));

    return result ?? false;
}
```

When granting access to data based on scopes, be sure to follow [the principle of least privilege](https://docs.microsoft.com/azure/active-directory/develop/secure-least-privileged-access).

### Debugging the sample

To debug the .NET Core web API that comes with this sample, install the [C# extension](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp) for Visual Studio Code.

Learn more about using [.NET Core with Visual Studio Code](https://docs.microsoft.com/dotnet/core/tutorials/with-visual-studio-code).

## More information

- [Microsoft identity platform (Azure Active Directory for developers)](https://docs.microsoft.com/azure/active-directory/develop/)
- [Overview of Microsoft Authentication Library (MSAL)](https://docs.microsoft.com/azure/active-directory/develop/msal-overview)
- [Quickstart: Register an application with the Microsoft identity platform](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app)
- [Quickstart: Configure a client application to access web APIs](https://docs.microsoft.com/azure/active-directory/develop/quickstart-configure-app-access-web-apis)
- [Initialize client applications using MSAL.js](https://docs.microsoft.com/azure/active-directory/develop/msal-js-initializing-client-applications)
- [Handle MSAL.js exceptions and errors](https://docs.microsoft.com/azure/active-directory/develop/msal-handling-exceptions?tabs=javascript)
- [Logging in MSAL.js applications](https://docs.microsoft.com/azure/active-directory/develop/msal-logging?tabs=javascript)
- [Microsoft Identity Web authentication library](https://docs.microsoft.com/azure/active-directory/develop/microsoft-identity-web)
- [Logging in MSAL.NET applications](https://docs.microsoft.com/azure/active-directory/develop/msal-logging-dotnet)
- [Handle errors and exceptions in MSAL.NET](https://docs.microsoft.com/azure/active-directory/develop/msal-error-handling-dotnet)

For more information about how OAuth 2.0 protocols work in this scenario and other scenarios, see [Authentication Scenarios for Azure AD](https://docs.microsoft.com/azure/active-directory/develop/authentication-flows-app-scenarios).

## Community Help and Support

Use [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) to get support from the community.
Ask your questions on Stack Overflow first and browse existing issues to see if someone has asked your question before.
Make sure that your questions or comments are tagged with [`azure-active-directory` `dotnet` `ms-identity` `adal` `msal`].

If you find a bug in the sample, raise the issue on [GitHub Issues](../../../issues).

To provide feedback on or suggest features for Azure Active Directory, visit [User Voice page](https://feedback.azure.com/forums/169401-azure-active-directory).

## Contributing

If you'd like to contribute to this sample, see [CONTRIBUTING.MD](/CONTRIBUTING.md).

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information, see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
