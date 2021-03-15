# Deploy your React Application to Azure Cloud and use Azure services to manage your operations

 1. [Overview](#overview)
 1. [Scenario](#scenario)
 1. [Prerequisites](#prerequisites)
 1. [Registration](#registration)
 1. [Deployment](#deployment)
 1. [Explore the sample](#explore-the-sample)
 1. [More information](#more-information)
 1. [Community Help and Support](#community-help-and-support)
 1. [Contributing](#contributing)
 1. [Code of Conduct](#code-of-conduct)

## Overview

This sample demonstrates how to deploy a React single-page application (SPA) coupled with a Node.js web API to **Azure Cloud** using [Azure Storage](https://docs.microsoft.com/azure/storage/blobs/) and [Azure App Service](https://docs.microsoft.com/azure/app-service/), respectively.

Azure Storage provides a low cost static website hosting alternative. However, these static websites do not have advanced routing capabilities. As such, [the React SPA in this tutorial](./SPA) does not have a router component.

For React applications with routing support, you can use [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/) instead. See [Static Web App Deployment](../2-deploy-static/README.md) in the next section.

## Scenario

1. The client application uses **MSAL React** to sign-in a user and obtain a JWT **Access Token** from **Azure AD**.
1. The **Access Token** is used as a **bearer** token to *authorize* the user to call the protected web API.
1. The protected web API responds with the claims in the **Access Token**.

![Overview](./ReadmeFiles/topology.png)

## Prerequisites

- [VS Code Azure Tools Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-node-azure-pack) extension is recommended for interacting with **Azure** through VS Code interface.
- An **Azure subscription**. This sample uses **Azure Storage** and **Azure App Service**.

## Setup

### Step 1: Clone or download this repository

From your shell or command line:

```console
    git clone https://github.com/Azure-Samples/ms-identity-javascript-react-tutorial.git
```

or download and extract the repository .zip file.

> :warning: To avoid path length limitations on Windows, we recommend cloning into a directory near the root of your drive.

### Step 2: Install project dependencies

- Setup the service app:

```console
    cd ms-identity-javascript-react-tutorial
    cd 4-Deployment/1-deploy-storage
    cd API
    npm install
```

- Setup the client app:

```console
    cd ..
    cd SPA
    npm install
```

## Registration

### Register the service app (Node.js web API)

Use the same app registration credentials that you've obtained during [**chapter 3-1**](../../3-Authorization-II/1-call-api/README.md#registration). Update your project files here as needed.

### Register the client app (React SPA)

Use the same app registration credentials that you've obtained during [**chapter 3-1**](../../3-Authorization-II/1-call-api/README.md#registration). Update your project files here as needed.

## Deployment

### Deploying web API to Azure App Services

There is one web API in this sample. To deploy it to **Azure App Services**, you'll need to:

- create an **Azure App Service**
- publish the projects to the **App Services**

#### Publish your files (TodoListAPI)

1. Sign-in to **App Service** using an Azure AD Account.
1. Open the `TodoListAPI` project folder.
1. Choose **View** > **Terminal** from the main menu.
1. The terminal opens in the `TodoListAPI` folder.
1. Run the following command:

    ```console
    dotnet publish --configuration Release
    ```

1. Publish folder is created under path `bin/Release/<Enter_Framework_FolderName>`.
1. Right-click on **Publish** folder and select **Deploy to Web App**.
1. Select **Create New Web App**, enter a unique name for the app.
1. Select **Windows** as the OS. Press **Enter**.

#### Disable Azure App Services default authentication (TodoListAPI)

1. Go to [Azure Portal](https://portal.azure.com), and locate your project there.
    - On the Settings tab, select **Authentication/Authorization**. Make sure `App Service Authentication` is Off. Select **Save**.
1. Browse your website. If you see the default web page of the project, the publication was successful.

#### Enable cross-origin resource sharing (CORS) (TodoListAPI)

1. Go to [Azure Portal](https://portal.azure.com), and locate your project there.
    - On the API tab, select **CORS**. Check the box **Enable Access-Control-Allow-Credentials**.
    - Under **Allowed origins**, add the coordinates of your published website.

### Deploying SPA to Azure Storage

There is one single-page application in this sample. To deploy it to **Azure Storage**, you'll need to:

- create an Azure Storage blob and obtain website coordinates
- build your project and upload it to Azure Storage blob
- update config files with website coordinates

> :information_source: If you would like to use **VS Code Azure Tools** extension for deployment, [watch the tutorial](https://docs.microsoft.com/azure/developer/javascript/tutorial-vscode-static-website-node-01) offered by Microsoft Docs.

#### Build and upload the `TodoListSPA` to an Azure Storage blob

Build your project to get a distributable files folder, where your built `html`, `css` and `javascript` files will be generated.

```console
    cd TodoListSPA
    npm run build
```

Then follow the steps below:

> :warning: When uploading, make sure you upload the contents of your distributable files folder and **not** the entire folder itself.

> :information_source: If you don't have an account already, see: [How to create a storage account](https://docs.microsoft.com/azure/storage/common/storage-account-create).

1. Sign in to the [Azure portal](https://portal.azure.com).
1. Locate your storage account and display the account overview.
1. Select **Static website** to display the configuration page for static websites.
1. Select **Enabled** to enable static website hosting for the storage account.
1. In the **Index document name** field, specify a default index page (For example: `index.html`).
1. The default **index page** is displayed when a user navigates to the root of your static website.
1. Select **Save**. The Azure Portal now displays your static website endpoint. Make a note of the **Primary endpoint field**.
1. In the `TodoListSPA` project source code, update your configuration file with the **Primary endpoint field** as your new **Redirect URI** (you will register this URI later).
1. Next, select **Storage Explorer**.
1. Expand the **BLOB CONTAINERS** node, and then select the `$web` container.
1. Choose the **Upload** button to upload files.
1. If you intend for the browser to display the contents of file, make sure that the content type of that file is set to `text/html`.
1. In the pane that appears beside the **account overview page** of your storage account, select **Static Website**. The URL of your site appears in the **Primary endpoint field**. In the next section, you will register this URI.

##### Update the Azure AD app registration for TodoListSPA

1. Navigate back to to the [Azure portal](https://portal.azure.com).
1. In the left-hand navigation pane, select the **Azure Active Directory** service, and then select **App registrations**.
1. In the resulting screen, select `TodoListSPA`.
1. In the app's registration screen, select **Authentication** in the menu.
   - In the **Redirect URIs** section, update the reply URLs to match the site URL of your Azure deployment. For example:
      - `https://TodoListSPA.azurewebsites.net/`

### Update authentication configuration parameters (TodoListSPA)

1. In your IDE, locate the `TodoListSPA` project. Then, open `TodoListSPA\src\app\auth-config.json`.
2. Find the key for **redirect URI** and replace its value with the address of the web app you published, for example, [https://TodoListSPA.azurewebsites.net](https://TodoListSPA.azurewebsites.net).
3. Find the key for **web API endpoint** and replace its value with the address of the web API you published, for example, [https://TodoListAPI.azurewebsites.net/api](https://TodoListAPI.azurewebsites.net/api/todolist).

## Explore the sample

1. Open your browser and navigate to your deployed client app's URI, for instance: `https://reactspa1.z22.web.core.windows.net/`.
1. Select the **Sign In** button on the top right corner. Choose either **Popup** or **Redirect** flow.
1. Select the **Profile** button on the navigation bar. This will make a call to the Microsoft Graph API.
1. Select the **HelloAPI** button on the navigation bar. This will make a call to your web API.

![Screenshot](./ReadmeFiles/screenshot.png)

## We'd love your feedback!

Were we successful in addressing your learning objective? Consider taking a moment to [share your experience with us](https://forms.office.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR73pcsbpbxNJuZCMKN0lURpUOU5PNlM4MzRRV0lETkk2ODBPT0NBTEY5MCQlQCN0PWcu).

## More information

- [Azure Blob Storage](https://docs.microsoft.com/azure/storage/blobs/)
- [Azure App Services](https://docs.microsoft.com/azure/app-service/)

For more information about how OAuth 2.0 protocols work in this scenario and other scenarios, see [Authentication Scenarios for Azure AD](https://docs.microsoft.com/azure/active-directory/develop/authentication-flows-app-scenarios).

## Community Help and Support

Use [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) to get support from the community.
Ask your questions on Stack Overflow first and browse existing issues to see if someone has asked your question before.
Make sure that your questions or comments are tagged with [`azure-ad` `azure-ad-b2c` `ms-identity` `msal`].

If you find a bug in the sample, please raise the issue on [GitHub Issues](../../issues).

To provide a recommendation, visit the following [User Voice page](https://feedback.azure.com/forums/169401-azure-active-directory).

## Contributing

If you'd like to contribute to this sample, see [CONTRIBUTING.MD](../../CONTRIBUTING.md).

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information, see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.