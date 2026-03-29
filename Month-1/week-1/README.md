
# Week 1 — My CKB Foundations (Wallets, Cells & Node Setup)

This week, I focused on understanding the **core fundamentals of Nervos CKB** and getting hands-on with the ecosystem using Lumos.

I tried to understand **how CKB actually works under the hood**.

---

##  What I Learned About CKB

### 🔹 The Cell Model (UTXO… but better)

One of the biggest shifts for me was understanding that CKB **does not use an account model like Ethereum**.

Instead, it uses a **Cell Model**:

* A **Cell** is the basic unit of storage
* Each cell contains:

  * `capacity` → amount of CKB
  * `lock script` → who can spend it
  * `type script` → optional logic

So instead of updating balances:

* I **consume existing cells**
* Then **create new cells**

That’s how transactions work.

---

### 🔹 What This Changed in My Thinking

* I don’t “have a balance” → I **own cells**
* Sending CKB = restructuring cells
* There’s a minimum usable cell (~61 CKB)

``` An improved version of the account model is the cell model. ```

---

### 🔹 How Addresses Actually Work

I implemented this flow myself:

```text
mnemonic phrase → private key | private key (derived)
   ↓
public key
   ↓
blake160
   ↓
lock script
   ↓
CKB address
```

So when I generate a wallet, I’m really just building that pipeline.

---

##  Setup

From the root (`Month-1/`):

```bash
npm install
```

---

##  Running A Local CKB Node

I built a script to manage a local devnet + light client:

```bash
cd week-1
chmod +x run-ckb-services.sh (make it executable)
./run-ckb-services.sh
```

Options You can select from:

```text
1) Start CKB devnet
2) Setup + start light client
3) Start both
...
```

Once started, you get:

```text
CKB devnet RPC Proxy server running on http://127.0.0.1:28114
```

This RPC is automatically saved and used by my scripts in a .env file.

---

## Building Wallets Work 



### Generate a Random Wallet

```bash
npm run wallet -- --random
```

This gives me:

* private key
* blake160
* address

---

### Generate a Mnemonic Wallet

```bash
npm run wallet -- --mnemonic
```

This gives me:

* mnemonic phrase
* derived private key
* address

---

### Recover From Mnemonic

```bash
npm run wallet -- --from-mnemonic "word1 word2 word3 ..."
```

Optional:

```bash
--index 1
```

---

### Use Existing Private Key

```bash
npm run wallet -- --privateKey 0x...
```

---

##  Checking Balance

### Using Private Key

```bash
npm run balance -- --privateKey 0xYOUR_PRIVATE_KEY
```

---

### Using Mnemonic

```bash
npm run balance -- --from-mnemonic "word1 word2 ..."
```

---

##  Sending CKB

### Using Private Key

```bash
npm run send -- \
  --to ckt1... \
  --amount 100 \
  --privateKey 0xYOUR_PRIVATE_KEY
```

---

### Using Mnemonic

```bash
npm run send -- \
  --to ckt1... \
  --amount 100 \
  --from-mnemonic "word1 word2 ..."
```

---

### Optional Sender Override

```bash
--from ckt1...
```

If I don’t pass it, I derive it automatically.

---

##  Week 1 Structure

```text
week-1/
├── wallet.ts           # wallet generation & derivation
├── balance.ts          # balance checker
├── sendCKB.ts          # sending transactions
├── run-ckb-services.sh # local node manager
├── README.md
```

---

## ⚠️ Things I Noticed

* Minimum usable transfer ≈ **61 CKB**
* Everything revolves around **lock scripts**, not accounts

---

##  What I Actually Gained

By the end of this week, I can:

* Explain the **CKB cell model**
* Derive an address from scratch
* Generate wallets (random + mnemonic)
* Query balances using an indexer
* Build and sign transactions
* Run a local CKB environment



