/**
 * password.ts
 *
 * Password management using the browser Web Crypto API (SHA-256).
 * The hash is stored in chrome.storage.local — no plaintext password ever persists.
 */

/// <reference types="chrome-types" />

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function setPassword(password: string): Promise<void> {
  const hash = await sha256(password);
  await chrome.storage.local.set({ ckb_pw: hash });
}

export async function isPasswordSet(): Promise<boolean> {
  const { ckb_pw } = await chrome.storage.local.get("ckb_pw") as { ckb_pw?: string };
  return !!ckb_pw;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const { ckb_pw } = await chrome.storage.local.get("ckb_pw") as { ckb_pw?: string };
  if (!ckb_pw) return false;
  return (await sha256(password)) === ckb_pw;
}
