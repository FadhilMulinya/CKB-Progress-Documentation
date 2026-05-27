# Week 10 
### Fraud Detection and Network Bypass Testing

## What I explored

I explored whether CKB can withstand attack patterns when key transaction elements are missing. I tested several bypass scenarios, not just to break the network, but to understand how strong the current CKB transaction model is when I deliberately leave out signatures, witnesses, or valid type informati## Next steps

- Add more edge cases for malformed CKB transactions
- Confirm results against actual devnet transactions
- Measure how often the detection rules are triggered in realistic traffic
- Document which bypass attempts are rejected and which require stronger rule coverageon.

## What I did
- I built a fraud detection test suite in `Fraudulent-Transactions/src`
- I tested missing signatures, wrong witness counts, and transactions with no witnesses
- I examined dust attacks by creating many low-capacity outputs
- I checked fake type/script payloads and replay-style malformed transactions
- I verified the current detection rules are catching invalid structure and suspicious transaction shapes

## Why this matters

I wanted to know if CKB rejects bad transactions early, or if some malformed payloads can slip through. That means I was probing whether the network is actually strong, and whether it still behaves safely if core pieces are missing.

## Highlights

- `fraud_1_missing_signature.ts` validates that missing signature data is detected as critical
- `fraud_2_wrong_witness.ts` shows wrong witness counts are flagged as high severity
- `fraud_3_dust_attack.ts` simulates many sub-threshold outputs and checks for spam/dust behavior
- `fraud_4_fake_type.ts` is built to test invalid type script assumptions
- `fraud_5_replay_attack.ts` explores replay-like transaction structures
- `fraud_6_no_witnesses.ts` demonstrates that a transaction with inputs and no witnesses is a red flag

## How to run the tests

From `Month-3/week-10/Fraudulent-Transactions`:

- `pnpm test:fraud1` — run missing signature scenario
- `pnpm test:fraud2` — run wrong witness count scenario
- `pnpm test:fraud3` — run dust attack scenario
- `pnpm test:fraud4` — run fake type scenario
- `pnpm test:fraud5` — run replay attack scenario
- `pnpm test:fraud6` — run no witnesses scenario
- `pnpm test:all` — run the full fraud detection suite
- `pnpm test:devnet` — run the test suite against devnet if available

## What I learned

I learned that the network responds strongly to missing or malformed transaction inputs. The bypass tests were useful because they forced me to compare what happens when critical data is absent versus when the transaction is well-formed.

I am still curious about the boundaries: can a transaction with unusual witness data or a forged type script ever pass validation?.


