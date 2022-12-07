import { msalConfig } from './auth-config';

/**
 * This method stores the claim challenge to the sessionStorage in the browser to be used when acquiring a token
 * @param {String} claimsChallenge
 */
export const addClaimsToStorage = (
    claimsChallengeId: string,
    claimsChallenge: string
): void => {
    sessionStorage.setItem(claimsChallengeId, claimsChallenge)
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
 * This method removes the claim challenge from sessionStorage
 * @param {string} claimsChallengeId
 */
export const removeFromStorage = (claimsChallengeId: string): void => {
    sessionStorage.removeItem(claimsChallengeId);
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