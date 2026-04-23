/// <reference types="chrome-types" />

/**
 * localStorage.ts
 * Wrappers around chrome.storage.local for persisting the wallet key
 * NOTE: Private key is stored locally as plaintext for educational purposes
 */

// Check if we're in a Chrome extension context
function isChromeExtension(): boolean {
    return !!(typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local);
}

/**
 * Save the private key to chrome.storage.local
 * @param privateKey - The private key string to save (typically starts with 0x)
 */
export async function saveKey(privateKey: string): Promise<void> {
    if (!isChromeExtension()) {
        console.warn('Not in Chrome extension context, using localStorage fallback');
        localStorage.setItem('ckb_key', privateKey);
        return;
    }
    
    try {
        await chrome.storage.local.set({ ckb_key: privateKey });
    } catch (error) {
        console.error('Failed to save key to chrome.storage:', error);
        // Fallback to localStorage
        localStorage.setItem('ckb_key', privateKey);
    }
}

/**
 * Retrieve the private key from chrome.storage.local
 * @returns The private key string if found, null otherwise
 */
export async function getKey(): Promise<string | null> {
    if (!isChromeExtension()) {
        console.warn('Not in Chrome extension context, using localStorage fallback');
        return localStorage.getItem('ckb_key');
    }
    
    try {
        const result = await chrome.storage.local.get("ckb_key");
        const ckb_key = result.ckb_key as string | undefined;
        return ckb_key ?? null;
    } catch (error) {
        console.error('Failed to get key from chrome.storage:', error);
        // Fallback to localStorage
        return localStorage.getItem('ckb_key');
    }
}

/**
 * Check if a private key exists in storage
 * @returns True if a key exists, false otherwise
 */
export async function hasKey(): Promise<boolean> {
    const key = await getKey();
    return key !== null && key !== undefined;
}

/**
 * Clear all data from chrome.storage.local
 * This removes both password hash and private key
 */
export async function clearAll(): Promise<void> {
    if (!isChromeExtension()) {
        console.warn('Not in Chrome extension context, clearing localStorage');
        localStorage.removeItem('ckb_key');
        localStorage.removeItem('ckb_pw');
        return;
    }
    
    try {
        await chrome.storage.local.clear();
    } catch (error) {
        console.error('Failed to clear chrome.storage:', error);
        // Fallback to localStorage
        localStorage.removeItem('ckb_key');
        localStorage.removeItem('ckb_pw');
    }
}

// Optional: Add a helper to check storage availability
export async function isStorageAvailable(): Promise<boolean> {
    if (!isChromeExtension()) return false;
    
    try {
        await chrome.storage.local.get('test');
        return true;
    } catch {
        return false;
    }
}