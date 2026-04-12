# Week 4 : CKB Wallet Chrome Extension

A minimal Chrome extension for sending and receiving CKB on testnet, built from scratch using the wallet and transaction logic from Month 1.

---

## What's in this extension

| Screen | What it does |
|---|---|
| Set Password | First launch — SHA-256 hashes and stores your password |
| Enter Password | Every subsequent launch — verifies before showing wallet |
| Setup Wallet | Generate a random private key OR import an existing one |
| Main Wallet | Shows address + balance, Send tab, Receive tab |

---

## How it maps to Month 1

| This file | Based on |
|---|---|
| `privKey.ts` | `Month-1/week-1/wallet.ts` + `sendCKB.ts` + `balance.ts` |
| `password.ts` | New — uses browser Web Crypto API (SHA-256) |
| `localStorage.ts` | New — wraps `chrome.storage.local` (not `window.localStorage`) |
| `popup.js` | New — UI orchestration |

The only adaptation needed from Month 1: replace Node's `randomBytes` with `crypto.getRandomValues` for key generation. Everything else (`hd.key`, `helpers`, `commons.common.transfer`, `hd.key.signRecoverable`) is identical — Parcel polyfills the Node.js internals for the browser automatically.

---

## File structure

```
week-4/
├── manifest.json       ← Chrome MV3 manifest
├── popup.html          ← 4-screen UI (password → setup → wallet)
├── popup.js            ← Entry point, wires up all screens
├── privKey.ts          ← Key gen, address derivation, balance, send
├── password.ts         ← Password hash + verify using Web Crypto
├── localStorage.ts     ← chrome.storage.local wrappers
├── icons.png           ← Extension icon
├── .parcelrc           ← Parcel webextension config
├── tsconfig.json       ← TypeScript config (browser target)
├── package.json        ← Build scripts
└── dist/               ← Built extension (load this in Chrome)
```

---

## Build & load in Chrome

```bash
cd Month-2/week-4

# Install dependencies (first time only)
pnpm install

# Build the extension
pnpm build

# For development (auto-rebuilds on save)
pnpm dev
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder
5. Pin the extension to the toolbar for easy access

