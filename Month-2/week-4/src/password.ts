/// <reference types="chrome-types" />

/**
 * Local extension Password management using Web Crypto API (SHA-256)
 * The hash is stored in chrome.storage.local - no plaintext password ever persists
 */

async function sha256(text: string): Promise<string> {
    const data = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Check if we're in a Chrome extension context
function isChromeExtension(): boolean {
    return !!(typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local);
}

export async function setPassword(password: string): Promise<void> {
    const hash = await sha256(password);
    
    if (!isChromeExtension()) {
        console.warn('Not in Chrome extension context, using localStorage fallback');
        localStorage.setItem('ckb_pw', hash);
        return;
    }
    
    try {
        await chrome.storage.local.set({ ckb_pw: hash });
    } catch (error) {
        console.error('Failed to save password to chrome.storage:', error);
        localStorage.setItem('ckb_pw', hash);
    }
}

export async function isPasswordSet(): Promise<boolean> {
    if (!isChromeExtension()) {
        return !!localStorage.getItem('ckb_pw');
    }
    
    try {
        const result = await chrome.storage.local.get("ckb_pw");
        return !!result.ckb_pw;
    } catch (error) {
        console.error('Failed to check password from chrome.storage:', error);
        return !!localStorage.getItem('ckb_pw');
    }
}

export async function verifyPassword(password: string): Promise<boolean> {
    const hash = await sha256(password);
    
    if (!isChromeExtension()) {
        const storedHash = localStorage.getItem('ckb_pw');
        return storedHash === hash;
    }
    
    try {
        const result = await chrome.storage.local.get("ckb_pw");
        const storedHash = result.ckb_pw as string | undefined;
        return storedHash === hash;
    } catch (error) {
        console.error('Failed to verify password from chrome.storage:', error);
        const storedHash = localStorage.getItem('ckb_pw');
        return storedHash === hash;
    }
}