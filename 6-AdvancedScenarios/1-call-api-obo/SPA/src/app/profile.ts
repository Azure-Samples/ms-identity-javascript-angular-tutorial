import { User } from "@microsoft/microsoft-graph-types";

export type Profile = Pick<User, "id" | "userPrincipalName" | "givenName" | "surname" | "jobTitle" | "mobilePhone" | "preferredLanguage"> & {
    firstLogin: boolean,
}