import { msalConfig } from '../auth-config';

/**
 * This method stores the claim challenge to the localStorage in the browser to be used when acquiring a token
 * @param {String} claimsChallenge
 */
export const addClaimsToStorage = (
  claimsChallenge: string,
  claimsChallengeId: string
): void => {
  isBase64String(claimsChallenge) ? sessionStorage.setItem(claimsChallengeId, claimsChallenge)
    : sessionStorage.setItem(claimsChallengeId, window.btoa(claimsChallenge));
};

/**
 * This method fetches the claim challenge from localStorage
 * @param {string} claimsChallengeId
 * @returns
 */
export const getClaimsFromStorage = (claimsChallengeId: string): any => {
  return sessionStorage.getItem(claimsChallengeId);
};

/**
 * This method clears localStorage of any claims challenge entry
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
  const base64regex = /[A-Za-z0-9+/=]/;
  return base64regex.test(str);
};
