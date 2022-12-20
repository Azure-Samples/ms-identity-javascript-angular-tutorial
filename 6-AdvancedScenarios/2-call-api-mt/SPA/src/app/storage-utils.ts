import { msalConfig } from './auth-config';

/**
 * This method stores the claim to the sessionStorage in the browser to be used when acquiring a token
 * @param {string} homeAccountId
 * @param {string} claims
 */
export const addClaimsToStorage = (homeAccountId: string, claims: string): void => {
    sessionStorage.setItem(`acs.${msalConfig.auth.clientId}.${homeAccountId}`, claims)
};

/**
 * This method fetches the claim from sessionStorage
 * @param {string} homeAccountId
 * @returns
 */
export const getClaimsFromStorage = (homeAccountId: string): any => {
    return sessionStorage.getItem(`acs.${msalConfig.auth.clientId}.${homeAccountId}`);
};

/**
 * This method removes the claim from sessionStorage
 * @param {string} homeAccountId
 */
export const removeClaimsFromStorage = (homeAccountId: string): void => {
    sessionStorage.removeItem(`acs.${msalConfig.auth.clientId}.${homeAccountId}`);
};

/**
 * This method clears sessionStorage of any claims entry
 * @param {string} homeAccountId
 */
export const clearStorage = (homeAccountId: string): void => {
    for (var key in sessionStorage) {
        if (key.startsWith(`acs.${msalConfig.auth.clientId}.${homeAccountId}`)) {
            sessionStorage.removeItem(key);
        }
    }
};