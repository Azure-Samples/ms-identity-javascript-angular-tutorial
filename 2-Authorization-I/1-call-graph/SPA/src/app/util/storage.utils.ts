import {
  msalConfig,
  protectedResources,
} from '../auth-config';
/**
 *  This method stores the claim challenge to the localStorage in the browser to be used when acquiring a token
 * @param {String} claimsChallenge
 */
export const addClaimsToStorage = (claimsChallenge: string, claimsChallengeId: string): void =>  {
  sessionStorage.setItem(claimsChallengeId, claimsChallenge);
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
        if (key === `cc.${msalConfig.auth.clientId}.${account.idTokenClaims.oid}`) sessionStorage.removeItem(key);
    }
};

export const getStorageSchema = (endpoint: string) => {
  
  if(endpoint.includes(protectedResources.graphMe.resource)){
    return protectedResources.graphMe.resource
  }else if(endpoint.includes(protectedResources.armTenants.resource)){
     return protectedResources.armTenants.resource;
  }
  return '';

}



