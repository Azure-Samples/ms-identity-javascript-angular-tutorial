---
page_type: sample
name: Multi-tenant (SaaS) Angular single-page application to sign-in users with Azure AD and call a protected .NET Core web API
description: Multi-tenant (SaaS) Angular single-page application to sign-in users with Azure AD and call a protected .NET Core web API
languages:
 - javascript
 - typescript
 - csharp
products:
 - azure-active-directory
 - aspnet-core
 - msal-js
 - msal-angular
urlFragment: ms-identity-javascript-angular-tutorial
extensions:
- services: ms-identity
- platform: javascript
- endpoint: AAD v2.0
- level: 200
- client: Angular SPA
- service: .NET Core web API
---

# Multi-tenant (SaaS) Angular single-page application to sign-in users with Azure AD and call a protected .NET Core web API

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

This sample demonstrates how to develop a multi-tenant, cross-platform application suite comprising of an Angular single-page application (*TodoListSPA*) calling an ASP.NET Core web API (*TodoListAPI*) secured with Azure Active Directory (Azure AD). Due to the topology of this application suite (*multi-tier*, *multi-tenant*), additional steps are needed for making the apps available to users in other tenants.

When it comes to integrate Azure AD authentication in their apps, developers can choose to configure their app to be either **single-tenant** or **multi-tenant** while registering their app in the [Azure portal](https://portal.azure.com).

- `Single tenant` apps are only available in the tenant they were registered in, also known as their **home tenant**.
- `Multi-tenant` apps are available to users in both their home tenant and other tenants where they are **provisioned**. Apps that allow users to sign-in using their personal accounts that they use to sign into services like Xbox and Skype are also multi-tenant apps. We will cover provisioning of a multi-tenant app in other tenants using **admin-consent**

> A recording of a Microsoft Identity Platform developer session that covered this topic of developing a multi-tenant app with Azure Active Directory is available at [Develop multi-tenant applications with Microsoft identity platform](https://www.youtube.com/watch?v=B416AxHoMJ4).

In order to grasp the relevant aspects of **multitenancy** covered in the sample, please follow [About the code](#about-the-code) section below.

## Scenario

- **TodoListSPA** uses [MSAL Angular](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular) to authenticate a user and obtains an [access token](https://docs.microsoft.com/azure/active-directory/develop/access-tokens) from Azure AD in the name of the current user.
- The access token is then used by the **TodoListAPI** to authorize the user.
- **TodoListAPI** uses [Microsoft.Identity.Web](https://github.com/AzureAD/microsoft-identity-web) to protect its endpoint and accept authorized calls.

![Topology](./ReadmeFiles/ch2_topology.png)

## Contents

| File/folder                  | Description                                |
|------------------------------|--------------------------------------------|
| `API/appsettings.json`       | Authentication configuration parameters. |
| `SPA/src/app/auth-config.ts` | Authentication configuration parameters. |
| `SPA/src/app/consent/consent.component.ts` | Admin consent is handled here. |

## Prerequisites

* Either [Visual Studio](https://visualstudio.microsoft.com/downloads/) or [Visual Studio Code](https://code.visualstudio.com/download) and [.NET Core SDK](https://www.microsoft.com/net/learn/get-started)
- You would need *at least* **two** Azure Active Directory (Azure AD) tenants to successfully run this sample. For more information on how to get an Azure AD tenant, see [How to get an Azure AD tenant](https://azure.microsoft.com/documentation/articles/active-directory-howto-tenant/).
- On each tenant, *at least* **one** admin account (:warning: i.e. global admin) and **one** non-admin/user account should be present for testing purposes.

## Setup the sample

### Step 1: Clone or download this repository

From your shell or command line:

```console
git clone https://github.com/Azure-Samples/ms-identity-javascript-angular-tutorial.git
```

> :warning: To avoid path length limitations on Windows, we recommend cloning into a directory near the root of your drive.

### Step 2. Install .NET Core API dependencies

```console
    cd ms-identity-javascript-angular-tutorial
    cd 6-AdvancedScenarios/2-call-api-mt/API
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

### Register the service app (msal-dotnet-api)

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure Active Directory** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
    1. In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-dotnet-api`.
    1. Under **Supported account types**, select **Accounts in any organizational directory**
    1. Select **Register** to create the application.
1. In the **Overview** blade, find and note the **Application (client) ID**. You use this value in your app's configuration file(s) later in your code.
1. Since this app signs-in users, we will now proceed to select **delegated permissions**, which is is required by apps signing-in users.
    1. In the app's registration screen, select the **API permissions** blade in the left to open the page where we add access to the APIs that your application needs:
    1. Select the **Add a permission** button and then:
    1. Ensure that the **Microsoft APIs** tab is selected.
    1. In the *Commonly used Microsoft APIs* section, select **Microsoft Graph**
    1. In the **Delegated permissions** section, select **User.Read** in the list. Use the search box if necessary.
    1. Select the **Add permissions** button at the bottom.
1. In the app's registration screen, select the **Expose an API** blade to the left to open the page where you can publish the permission as an API for which client applications can obtain [access tokens](https://aka.ms/access-tokens) for. The first thing that we need to do is to declare the unique [resource](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow) URI that the clients will be using to obtain access tokens for this API. To declare an resource URI(Application ID URI), follow the following steps:
    1. Select **Set** next to the **Application ID URI** to generate a URI that is unique for this app.
    1. For this sample, accept the proposed Application ID URI (`api://{clientId}`) by selecting **Save**.
        > :information_source: Read more about Application ID URI at [Validation differences by supported account types (signInAudience)](https://docs.microsoft.com/azure/active-directory/develop/supported-accounts-validation).

##### Publish Delegated Permissions

1. All APIs must publish a minimum of one [scope](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow#request-an-authorization-code), also called [Delegated Permission](https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#permission-types), for the client apps to obtain an access token for a *user* successfully. To publish a scope, follow these steps:
1. Select **Add a scope** button open the **Add a scope** screen and Enter the values as indicated below:
    1. For **Scope name**, use `TodoList.Read`.
    1. Select **Admins and users** options for **Who can consent?**.
    1. For **Admin consent display name** type in *TodoList.Read*.
    1. For **Admin consent description** type in *e.g. Allows the app to read the signed-in user's files.*.
    1. For **User consent display name** type in *scopeName*.
    1. For **User consent description** type in *eg. Allows the app to read your files.*.
    1. Keep **State** as **Enabled**.
    1. Select the **Add scope** button on the bottom to save this scope.
    > Repeat the steps above for another scope named **TodoList.ReadWrite**
1. Select the **Manifest** blade on the left.
    1. Set `accessTokenAcceptedVersion` property to **2**.
    1. Select on **Save**.

> :information_source:  Follow [the principle of least privilege when publishing permissions](https://learn.microsoft.com/security/zero-trust/develop/protected-api-example) for a web API.

##### Publish Application Permissions

1. All APIs should publish a minimum of one [App role for applications](https://docs.microsoft.com/azure/active-directory/develop/howto-add-app-roles-in-azure-ad-apps#assign-app-roles-to-applications), also called [Application Permission](https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#permission-types), for the client apps to obtain an access token as *themselves*, i.e. when they are not signing-in a user. **Application permissions** are the type of permissions that APIs should publish when they want to enable client applications to successfully authenticate as themselves and not need to sign-in users. To publish an application permission, follow these steps:
1. Still on the same app registration, select the **App roles** blade to the left.
1. Select **Create app role**:
    1. For **Display name**, enter a suitable name for your application permission, for instance **TodoList.Read.All**.
    1. For **Allowed member types**, choose **Application** to ensure other applications can be granted this permission.
    1. For **Value**, enter **TodoList.Read.All**.
    1. For **Description**, enter *e.g. Allows the app to read the signed-in user's files.*.
    1. Select **Apply** to save your changes.

    > Repeat the steps above for another app permission named **TodoList.ReadWrite.All**

##### Configure Optional Claims

1. Still on the same app registration, select the **Token configuration** blade to the left.
1. Select **Add optional claim**:
    1. Select **optional claim type**, then choose **Access**.
     1. Select the optional claim **idtyp**.
    > Indicates token type. This claim is the most accurate way for an API to determine if a token is an app token or an app+user token. This is not issued in tokens issued to users.
     1. Select the optional claim **acct**.
    > Provides user's account status in tenant. If the user is a **member** of the tenant, the value is *0*. If they're a **guest**, the value is *1*.
    1. Select **Add** to save your changes.

##### Configure the service app (msal-dotnet-api) to use your app registration

Open the project in your IDE (like Visual Studio or Visual Studio Code) to configure the code.

> In the steps below, "ClientID" is the same as "Application ID" or "AppId".

1. Open the `API\TodoListAPI\appsettings.json` file.
1. Find the key `Enter the domain of your Azure AD tenant, e.g. 'contoso.onmicrosoft.com'` and replace the existing value with your Azure AD tenant domain, ex. `contoso.onmicrosoft.com`.
1. Find the key `Enter the Client ID (aka 'Application ID')` and replace the existing value with the application ID (clientId) of `msal-dotnet-api` app copied from the Azure portal.
1. Find the key `Enter the tenant ID` and replace the existing value with your Azure AD tenant/directory ID.

### Register the client app (msal-angular-spa)

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure Active Directory** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
    1. In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-angular-spa`.
    1. Under **Supported account types**, select **Accounts in any organizational directory**
    1. Select **Register** to create the application.
1. In the **Overview** blade, find and note the **Application (client) ID**. You use this value in your app's configuration file(s) later in your code.
1. In the app's registration screen, select the **Authentication** blade to the left.
1. If you don't have a platform added, select **Add a platform** and select the **Single-page application** option.
    1. In the **Redirect URI** section enter the following redirect URIs:
        1. `http://localhost:4200`
        1. `https://localhost:4200/auth`
    1. Click **Save** to save your changes.
1. Since this app signs-in users, we will now proceed to select **delegated permissions**, which is is required by apps signing-in users.
    1. In the app's registration screen, select the **API permissions** blade in the left to open the page where we add access to the APIs that your application needs:
    1. Select the **Add a permission** button and then:
    1. Ensure that the **My APIs** tab is selected.
    1. In the list of APIs, select the API `msal-dotnet-api`.
    1. In the **Delegated permissions** section, select **TodoList.Read**, **TodoList.ReadWrite** in the list. Use the search box if necessary.
    1. Select the **Add permissions** button at the bottom.
    1. Select the **Add a permission** button and then:
    1. Ensure that the **Microsoft APIs** tab is selected.
    1. In the *Commonly used Microsoft APIs* section, select **Microsoft Graph**
    1. In the **Delegated permissions** section, select **User.Read.All** in the list. Use the search box if necessary.
    1. Select the **Add permissions** button at the bottom.

##### Configure Optional Claims

1. Still on the same app registration, select the **Token configuration** blade to the left.
1. Select **Add optional claim**:
    1. Select **optional claim type**, then choose **Access**.
     1. Select the optional claim **acct**.
    > Provides user's account status in tenant. If the user is a **member** of the tenant, the value is *0*. If they're a **guest**, the value is *1*.
    1. Select **Add** to save your changes.

##### Configure the client app (msal-angular-spa) to use your app registration

Open the project in your IDE (like Visual Studio or Visual Studio Code) to configure the code.

> In the steps below, "ClientID" is the same as "Application ID" or "AppId".

1. Open the `SPA\src\app\auth-config.ts` file.
1. Find the key `Enter_the_Application_Id_Here` and replace the existing value with the application ID (clientId) of `msal-angular-spa` app copied from the Azure portal.
1. Find the key `Enter_the_Tenant_Info_Here` and replace the existing value with your Azure AD tenant/directory ID.
1. Find the key `Enter_the_Web_Api_Application_Id_Here` and replace the existing value with the application ID (clientId) of `msal-dotnet-api` app copied from the Azure portal.

#### Configure Known Client Applications for service (msal-dotnet-api)

For a middle-tier web API (`msal-dotnet-api`) to be able to call a downstream web API, the middle tier app needs to be granted the required permissions as well. However, since the middle-tier cannot interact with the signed-in user, it needs to be explicitly bound to the client app in its **Azure AD** registration. This binding merges the permissions required by both the client and the middle-tier web API and presents it to the end user in a single consent dialog. The user then consent to this combined set of permissions. To achieve this, you need to add the **Application Id** of the client app to the `knownClientApplications` property in the **manifest** of the web API. Here's how:

1. In the [Azure portal](https://portal.azure.com), navigate to your `msal-dotnet-api` app registration, and select the **Manifest** blade.
1. In the manifest editor, change the `knownClientApplications: []` line so that the array contains the Client ID of the client application (`msal-angular-spa`) as an element of the array.

For instance:

```json
    "knownClientApplications": ["ca8dca8d-f828-4f08-82f5-325e1a1c6428"],
```

1. **Save** the changes to the manifest.


### Step 5: Running the sample

Using a command line interface such as **VS Code** integrated terminal, locate the application directory. Then:  

```console
   cd ../
   cd SPA
   npm start
```

In a separate console window, execute the following commands

```console
   cd API
   dotnet run
```

## Explore the sample

1. Open your browser and navigate to `http://localhost:4200`.

1. Sign-in using the button on top-right:

![login](./ReadmeFiles/ch2_login.png)

Regular users won't be able to sign-in, until an **admin-user** provides **admin-consent** to application permissions.

![admin](./ReadmeFiles/ch2_error.png)

You can either consent as admin during initial sign-in, or if you miss this step, via the **Admin** page

![admin](./ReadmeFiles/ch2_admin_prompt.png)

![admin](./ReadmeFiles/ch2_admin.png)

1. Once **admin-consent** is provided, users can select the **Get my tasks** button to access the todo list. When you create a new task, you will also have an option to assign it to any other user from your tenant:

![assign](./ReadmeFiles/ch2_user_list.png)

> :information_source: Consider taking a moment to [share your experience with us](https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR73pcsbpbxNJuZCMKN0lURpUOU5PNlM4MzRRV0lETkk2ODBPT0NBTEY5MCQlQCN0PWcu)

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

Here we discuss some of the more important aspects of multi-tenant applications.

### Usage of `/common` endpoint

When registering an application with the Microsoft identity platform for developers, you are asked to select which account types your application supports. The options include the following:

| **Audience** | **Single/multi-tenant** | **Who can sign in** |
|----------|---------------------| --------------- |
| Accounts in this directory only | Single tenant | All user and guest accounts in your directory can use your application or API. *Use this option if your target audience is internal to your organization.* |
| Accounts in any Azure AD directory | Multi-tenant | All users and guests with a work or school account from Microsoft can use your application or API. This includes schools and businesses that use Office 365. *Use this option if your target audience is business or educational customers.* |
| Accounts in any Azure AD directory and personal Microsoft accounts (such as Skype, Xbox, Outlook.com) | Multi-tenant | All users with a work or school, or personal Microsoft account can use your application or API. It includes schools and businesses that use Office 365 as well as personal accounts that are used to sign in to services like Xbox and Skype. *Use this option to target the widest set of Microsoft accounts.* |

Your MSAL configuration will reflect your choice audience in the `authority` parameter. For instance, an application that targets  **accounts in this directory only** will have a configuration similar to:

```typescript
export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
        clientId: "<your-client-id>",
        authority: "https://login.microsoftonline.com/<your-tenant-id>",
        redirectUri: "http://localhost:4200/",
    },
  });
}
```

On the other hand, an application that targets **accounts in any Azure AD directory** will have its authority parameter set to `https://login.microsoftonline.com/organizations`, while for an application that targets **Accounts in any Azure AD directory and personal Microsoft accounts (such as Skype, Xbox, Outlook.com)** it will be `https://login.microsoftonline.com/common`. Here, `/organizations` and `/common` are not real tenants, they are just **multiplexers**.

> Please note that if you sign-in guest users at the `/common` (or `/organizations`) endpoint, they will be directed to their home tenant for signing-in. So, if your multi-tenant app cares about applying tenant specific conditional access policies, group assignments or app roles to be applied to the guest users, the app should sign-in the guest user on the **tenanted endpoint** (`https://login.microsoftonline.com/{tenantId}`) instead of the `/common` endpoint.

### Testing the Application

To properly test this application, you need *at least* **2** tenants, and on each tenant, *at least* **1** administrator and **1** non-administrator account.

Before each test, you should delete your **service principal** for the tenant you are about to test, in order to remove any previously given consents and start the **provisioning process** from scratch.

> #### How to delete Service Principals
>
> Steps for deleting a service principal differs with respect to whether the principal is in the **home tenant** of the application or in another tenant. If it is in the **home tenant**, you will find the entry for the application under the **App Registrations** blade. If it is another tenant, you will find the entry under the **Enterprise Applications** blade. Read more about these blades in the [How and why applications are added to Azure AD](https://docs.microsoft.com/azure/active-directory/develop/active-directory-how-applications-are-added).The screenshot below shows how to access the service principal from a **home tenant**:
>
> ![principal1](./ReadmeFiles/ch1_service_principal1.png)
>
> The rest of the process is the same for both cases. In the next screen, select **Properties** and then the **Delete** button on the upper side.
>
> ![principal1](./ReadmeFiles/ch1_service_principal2.png)
>
> You have now deleted the service principal for that tenant. Next time, once a user successfully authenticates to your application, a new service principal will be created (i.e. *provisioning*) in the tenant from which *that* user belongs.

### Ways of providing admin consent

A service principal of your multi-tenant app is created via one of the following ways.

1. When the first user signs-in to your app for the first time in a tenant.
1. Manually or programmatically created by a tenant admin using one of the following
   1. Using the [/adminconsent endpoint](https://docs.microsoft.com/azure/active-directory/develop/v2-admin-consent)
   1. [Using the PowerShell command](https://docs.microsoft.com/powershell/azure/create-azure-service-principal-azureps).

- **Consent during sign-in:**

This method requires the most minimal setup. The only thing needed is that the tenant admin signs-in first and *optionally* choose to "consent on behalf of your organization" during the AAD sign-in as shown in the screen below:

![consent](./ReadmeFiles/ch1_consent_onbehalf.png)

- **Consent using the `/adminconsent` endpoint**

This method provides a programmatic control over the consent process. To be able to **consent as an admin** with this method, there are two steps your application needs to carry out:

1. Determine the `tenantId` of the signed-in user.
2. Redirect the user to the correct `/adminconsent` endpoint (which is why you need the `tenantId`).

In your app, to send a tenant admin to the `/adminconsent` endpoint you would construct a URL as explained below:

```HTML
    // Line breaks are for legibility only.
    GET https://login.microsoftonline.com/{tenant}/v2.0/adminconsent?
    client_id=6731de76-14a6-49ae-97bc-6eba6914391e
    &state=12345
    &redirect_uri=http://localhost:4200
    &scope=calendars.read
```

This is demonstrated in the code snippet below:

```typescript
  adminConsent() {

    // if you want to work with multiple accounts, add your account selection logic below
    let account = this.authService.instance.getAllAccounts()[0];

    if (account) {
      const state = Math.floor(Math.random() * 90000) + 10000; // state parameter for anti token forgery
      
        const adminConsentUri = "https://login.microsoftonline.com/" + 
        `${account.tenantId}` + "/v2.0/adminconsent?client_id=" + 
        `${auth.credentials.clientId}` + "&state=" + `${state}` + "&redirect_uri=" + `${window.location.origin}` +
        "&scope=https://graph.microsoft.com/.default";
  
      // redirecting...
      window.location.replace(adminConsentUri);
      
    } else {
      window.alert('Please sign-in first.')
    }
  }
```

You can try the `/adminconsent` endpoint on the "Admin" page of the sample by clicking on the link on the navbar.

![admin consent endpoint](./ReadmeFiles/ch1_admin_consent_endpoint.png)

> #### The `.default` scope
>
> Did you notice the scope here is set to `.default`, as opposed to `User.Read.All`? This is a built-in scope for every application that refers to the static list of permissions configured on the application registration. Basically, it *bundles* all the permissions in one scope. The /.default scope can be used in any OAuth 2.0 flow. Read about `scopes` usage at [Scopes and permissions in the Microsoft Identity Platform](https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#scopes-and-permissions).  
  
When redirected to the `/adminconsent` endpoint, the tenant admin will see:

![consent](./ReadmeFiles/ch1_admin_redirect.png)

After you choose an admin account, it will lead to the following prompt:

![consent](./ReadmeFiles/ch1_admin_consent.png)

Once it finishes, your application service principal will be provisioned in that tenant.

### Scopes and sign-in Differences

The main scope of interest in this sample is `User.Read.All`. This is a MS Graph API scope, and it allows a user to read every user in the tenant. This scope requires a tenant admin to consent.

Remember that the first time you were not able to sign-in with a non-admin account before providing admin consent for that tenant.
To see why this was so, notice, in `src/app/app-module.ts`, how the MSAL Guard is setup:

```typescript
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return { 
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: [...auth.resources.graphApi.resourceScopes],
    },
  };
}
```

This means that the user will be prompted for consent during sign-in. However, since only an admin can consent to the scope `User.Read.All`, a non-admin account will simply not be able to login! (unless consented prior by a tenant admin). For best end-user experience, please have the tenant admin consent to your app before a user from the tenant tries to sign-in.

### Consenting to applications with distributed topology

Consider the application suite in this chapter: **msal-dotnet-api** and **msal-angular-spa**. From one perspective, they are two different applications (two different projects), each represented with their own **app registration** on Azure AD, but from another perspective, they really constitute one application together i.e. a todo list application. In practice, an application can have a many such components: one component for the front-end, another for a REST API, another for a database and etc. While these components should have their own separate representation on Azure AD, they should also somehow know one another.

From the perspective of **multi-tenancy**, the main challenge with such topologies is with providing admin-consent. This is due to the fact that some of their components, such as a web API or a background micro-service, do not have a front-end, and as such, has no user-interaction capability. The solution for this is to allow the user (in this case, an admin-user) to consent to web API at the same time they consent to the front-end application i.e. give a **combined consent**. In **Chapter 1**, we have seen that the `/.default` scope can be used to this effect, allowing you to consent to many different scopes at one step. However, unlike **Chapter 1**, our application suite here also has a back-end/web API component. But how could the web API know that the consent comes from a recognized front-end application, as opposed to some foreign application? The answer is to use the **KnownClientApplications** feature.

> #### KnownClientApplications
>
> **KnownClientApplications** is an attribute in **application manifest**. It is used for bundling consent if you have a solution that contains two (or more) parts: a client app and a custom web API. If you enter the `appID` (clientID) of the client app into this array, the user will only have to consent only once to the client app. Azure AD will know that consenting to the client means implicitly consenting to the web API. It will automatically provision service principals for both the client and web API at the same time. Both the client and the web API app must be registered in the same tenant.

If you remember the last step of the registration for the client app **msal-angular-spa**, you were instructed to find the `KnownClientApplications` in application manifest, and add the **application ID** (client ID) of the `msal-angular-spa` application `KnownClient witApplications: ["your-client-id-for-msal-angular-spa"]`. Once you do that, your web API will be able to correctly identify your front-end and the combined consent will be successfully carried out.

### Provisioning your multi-tenant apps in another Azure AD tenant

Often the user-based consent will be disabled in an Azure AD tenant or your application will be requesting permissions that requires a tenant-admin consent. In these scenarios, your application will need to utilize the `/adminconsent` endpoint to provision both the **msal-angular-spa** and the **msal-dotnet-api** before the users from that tenant are able to sign-in to your app.

When provisioning, you have to take care of the dependency in the topology where the **msal-angular-spa** is dependent on **msal-dotnet-api**. So in such a case, you would provision the **msal-dotnet-api** before the **msal-angular-spa**.

### Admin consent at different stages of application flow

This application requires an **admin-user** to consent to scope `api://{clientId-of-msal-dotnet-api}/.default` in order to provision the **msal-dotnet-api** web API to a tenant. This means **Azure AD** will check if **admin-consent** is provided to the aforementioned scope during the initial sign-in. As such, only a user with admin privileges will be able to sign-in for the **first time**. After that, any user from that admin's tenant can sign-in and use the application. This allows you to control whether an ordinary users can provision a **multi-tenant** app into their tenants.

If you would like to change this behavior i.e. allow regular users to sign-in to the app before *admin-consent* you can modify the [app.module.ts](./msal-angular-spa/src/app/app.module.ts) as below. Bear in mind, until *admin-consent* is provided, users won't be able to access the **msal-dotnet-api**, resulting in bad user experience.

```typescript
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return { 
    interactionType: InteractionType.Redirect,
   //  authRequest: {
   //    scopes: [...auth.resources.todoListApi.resourceScopes],
   //  },
  };
}
```

### Custom token validation allowing only registered tenants

By marking your application as multi-tenant, your application will be able to sign-in users from any Azure AD tenant out there. Now you would want to restrict the tenants you want to work with. For this, we will now extend token validation to only those Azure AD tenants registered in the application database.

Below, the event handler `OnTokenValidated` was configured to grab the `tenantId` from the token claims and check if it has an entry on the records. If it doesn't, an exception is thrown, canceling the authentication. (See: [Startup.cs](./msal-dotnet-api/Startup.cs))

```csharp
   services.Configure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
   {
      options.Events.OnTokenValidated = async context =>
      {
         string[] allowedTenants = { /* a list of IDs... */ };

         string tenantId = ((JwtSecurityToken)context.SecurityToken).Claims.FirstOrDefault(x => x.Type == "tid" || x.Type == "http://schemas.microsoft.com/identity/claims/tenantid")?.Value;

         if (!allowedTenants.Contains(tenantId))
         {
               throw new UnauthorizedAccessException("This tenant is not authorized");
         }
      };
   });
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
