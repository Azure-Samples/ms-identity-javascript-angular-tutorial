import { AccountInfo } from '@azure/msal-browser';

type GroupMembershipEntry = {
    groups: string[],
    lastAccessed: number,
    expiresOn: number,
    sourceTokenId: string,
};

/**
 * Stores the groups in session storage for the given account
 * @param {AccountInfo} account 
 * @param {Array} groups 
 */
export const setGroupsInStorage = (account: AccountInfo, groups: string[]): void => {
    if (!account.idTokenClaims) throw new Error('No idTokenClaims found in account');

    const newEntry: GroupMembershipEntry = {
        groups: groups,
        lastAccessed: Date.now(),
        expiresOn: account.idTokenClaims.exp!,
        sourceTokenId: account.idTokenClaims['uti'] as string,
    };

    sessionStorage.setItem(`gmc.${account.idTokenClaims.aud}.${account.idTokenClaims.oid}`, JSON.stringify(newEntry));
};

/**
 * Checks if the groups are in session storage and if their associated ID token is not expired
 * @param {AccountInfo} account 
 * @returns 
 */
export const checkGroupsInStorage = (account: AccountInfo): boolean => {
    if (!account.idTokenClaims) throw new Error('No idTokenClaims found in account');

    const storageEntry = sessionStorage.getItem(`gmc.${account.idTokenClaims.aud}.${account.idTokenClaims.oid}`);
    
    if (!storageEntry) return false;

    const parsedStorageEntry = JSON.parse(storageEntry);
    return parsedStorageEntry.groups && parsedStorageEntry.expiresOn <= account.idTokenClaims.exp! && parsedStorageEntry.sourceTokenId === account.idTokenClaims['uti'];
};

/**
 * Returns the groups array from session storage
 * @param {AccountInfo} account 
 * @returns 
 */
export const getGroupsFromStorage = (account: AccountInfo): string[] | null => {
    if (!account.idTokenClaims) throw new Error('No idTokenClaims found in account');

    const storageEntry = sessionStorage.getItem(`gmc.${account.idTokenClaims.aud}.${account.idTokenClaims.oid}`);
    
    if (!storageEntry) return null;

    return (JSON.parse(storageEntry) as GroupMembershipEntry).groups;
};

/**
 * This method clears session storage of group membership claims for the given account.
 * @param {AccountInfo} account
 */
export const clearGroupsInStorage = (account: AccountInfo): void => {
    for (var key in sessionStorage) {
        if (key.startsWith(`gmc.${account.idTokenClaims?.aud}.${account.idTokenClaims?.oid}`)) {
            sessionStorage.removeItem(key);
        }
    }
};
