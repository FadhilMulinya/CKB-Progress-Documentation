# Month 2: Learning CKB Development

## Week 4: Chrome Extension Wallet

Built a Chrome extension for sending/receiving CKB on testnet. Password protection, key generation, balance display, send/receive. Used the wallet code from Month 1, adapted for browser.

---

## Week 5: Payment Links

Switched from Lumos to CCC SDK. Built Chrome CKB extension with local wallets and implemented offchain payment links `ckbl:`  -- encoded URLs with recipient, amount, expiry, and cryptographic signature. Extension verifies links, checks expiry, autofills forms.

---

## Week 6: Autonomous Agents (Onhandl)

Built auto-splitting agents on CKB. Agents monitor addresses, split incoming funds to multiple destinations automatically. Built indexing layer for tracking cells in real-time and auto-update every 5 seconds.

---

## Week 7: First Rust Contract

Deep Dived into CKB Cell structure. Wrote a gift card contract in Rust -- lock funds until a block number, first person after that block claims it. Used offckb, ckb-cli, ckb-testtool. Deployed to testnet.

---

## What I did This Month in a nutshell

- Built a Chrome extension for CKB
- Wrote and deployed Rust smart contract(s)
- Built autonomous agents on CKB
- Now I understand Cells, scripts, transactions at protocol level
