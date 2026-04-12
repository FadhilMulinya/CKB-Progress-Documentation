/**
 * localStorage.ts
 *
 * Wrappers around chrome.storage.local for persisting the wallet key.
 *
 * NOTE: Private key is stored as plaintext for educational purposes.
 */

/// <reference types="chrome-types" />

export async function saveKey(privateKey: string): Promise<void> {
  await chrome.storage.local.set({ ckb_key: privateKey });
}

export async function getKey(): Promise<string | null> {
  const { ckb_key } = await chrome.storage.local.get("ckb_key") as { ckb_key?: string };
  return ckb_key ?? null;
}

export async function hasKey(): Promise<boolean> {
  return !!(await getKey());
}

// Wipes password hash + private key — full reset
export async function clearAll(): Promise<void> {
  await chrome.storage.local.clear();
}
