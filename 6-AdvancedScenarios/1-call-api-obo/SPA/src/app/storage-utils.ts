import { msalConfig } from './auth-config';

/**
 * This method stores the claim challenge to the sessionStorage in the browser to be used when acquiring a token
 * @param {String} claimsChallenge
 */
export const addClaimsToStorage = (claimsChallengeId: string, claimsChallenge: string): void => {
    sessionStorage.setItem(claimsChallengeId, claimsChallenge);
};

/**
 * This method fetches the claim challenge from sessionStorage
 * @param {string} claimsChallengeId
 * @returns
 */
export const getClaimsFromStorage = (claimsChallengeId: string): any => {
    return sessionStorage.getItem(claimsChallengeId);
};

/**
 * This method clears sessionStorage of any claims challenge entry
 * @param {Object} account
 */
export const clearStorage = (account: any): void => {
    for (var key in sessionStorage) {
        if (key.startsWith(`cc.${msalConfig.auth.clientId}.${account.idTokenClaims.oid}`)) {
            sessionStorage.removeItem(key);
        }
    }
};

/**
 * Checks if a string is base64 encoded
 * @param str a string to be checked if it is base64 encoded
 * @returns {boolean} true if the string is base64 encoded, false otherwise
 */
export const isBase64String = (str: string): boolean => {
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    console.log('is it?', base64regex.test(str));
    return base64regex.test(str);
};