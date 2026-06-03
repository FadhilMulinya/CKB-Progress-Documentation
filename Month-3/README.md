# Month 3: CKB Advanced Primitives, Security, & Wallet Intelligence

Welcome to my Month 3 progress report! This month transitioned from building application-level tools to exploring core CKB smart contracts in Rust, testing network resilience through transaction bypass simulations, and designing a privacy-preserving wallet intelligence pipeline.

Here is the breakdown of Month 3:

---

## [Week 8: CKB sUDT / xUDT Rust Deployment](./week-8/README.md)

Focused on writing and deploying custom fungible token contracts in Rust. 
- **What I did**: Developed the [simple-sudt](./week-8/ckb-udt-rust/contracts/simple-sudt/src/main.rs) contract for standard token validation, and the [simple-xudt](./week-8/ckb-udt-rust/contracts/simple-xudt/src/main.rs) contract for extensible validation with size-limited extension payloads.
- **Off-chain tooling**: Created a CLI minting utility [mint-token](./week-8/ckb-udt-rust/tools/mint-token/src/main.rs) to build and sign transactions for token cells on a local CKB devnet.
- **Results**: Verified both contract architectures on devnet and recorded script deployment details in [scripts.json](./week-8/ckb-udt-rust/deployments/devnet/scripts.json).

---

## [Week 9: Understanding Spore & Digital Objects](./week-9/README.md)

Explored Spore Digital Objects on CKB to understand how they differ from the traditional Ethereum NFT model.
- **Concept Shift**: Focused on the UTXO-based ownership model of CKB, where assets are governed by explicit Cell state transitions rather than account-based smart contract state variables.
- **What I built**: Created a simple [sporebadges](./week-9/sporebadges/README.md) contract prototype in Rust to experiment with issuer constraints, custom metadata structures, and soulbound-style transfer restrictions.
- **Rust Sharpening**: Refreshed Rust programming fundamentals to prepare for writing low-level scripts directly targeting the CKB-VM.

---

## [Week 10: Fraud Detection & Network Bypass Testing](./week-10/README.md)

Tested CKB transaction robustness by building a suite to simulate transaction-level attacks and verify validation behavior.
- **What I built**: Implemented a comprehensive fraud detection suite in [Fraudulent-Transactions/src](./week-10/Fraudulent-Transactions/src) to test edge cases.
- **Scenarios tested**: Simulating missing signatures, incorrect witness counts, dust/spam cell creation, invalid type scripts, replay transactions, and completely missing witnesses.
- **Outcome**: Verified that CKB rejects malformed inputs early, confirming the security model of the network under deliberate bypass attempts.

---

## [Week 11: Wallet Behaviour Intelligence on CKB](./week-11/README.md)

Designed and researched a behavioral intelligence pipeline to identify suspicious , automated wallet activity or non-human like behaviour on CKB while preserving privacy.
- **Ingestion**: Designed two extraction components one pulling raw chain data from CKB Node RPCs, and another utilizing the CKB Explorer API for richer historical lookups.
- **Feature Engineering**: Specified temporal (intervals, frequency) and graph-based (interaction flows, network clustering) wallet feature sets.
- **Federated Learning**: Researched client-server federated learning models using the Flower (`flwr`) framework to train model aggregates collaboratively without pooling raw transaction records.
- **Repositories**: Focused development across the data layer ([ckb-intel-node](https://github.com/buidlabz/ckb-intel-node)) and the federated layer ([ckb-intelligence](https://github.com/buidlabz/ckb-intelligence)).

---

## What I did This Month in a nutshell

- Wrote and deployed custom `sUDT` and `xUDT` token contracts in Rust.
- Internalized the Spore Digital Object standard and built a soulbound badge prototype.
- Probed the CKB-VM's safety limits with a dedicated fraud and bypass testing suite.
- Designed a privacy-preserving, federated wallet intelligence architecture.

```
NOTE: Every week's progress is in its own folder.
```