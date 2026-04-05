
# Week 1
### My CKB Foundations (Wallets, Cells & Node Setup)
###
This week, my main focus was really getting a grip on the **core fundamentals of Nervos CKB**. I didn't just want to read doc pages; I wanted to get hands-on with the ecosystem using Lumos and figure out **how CKB actually ticks under the hood**.

---

##  What I Learned About CKB

### 🔹 The Cell Model (It’s UTXO… but so much cooler)

Honestly, one of the biggest mental shifts for me was accepting that CKB **does absolutely not use an account model like Ethereum does**. 

It uses the **Cell Model**. Here’s what surprised me:
* A **Cell** is essentially the fundamental unit of storage. 
* Inside each of those cells, you have:
  * `capacity` → How much space (or CKB) you have.
  * `lock script` → The logic that decides who is allowed to spend it.
  * `type script` → An optional set of rules for the cell.

So, instead of a blockchain that updates my "balance," I’m doing something different:
* I **consume existing cells**.
* Then I **create new cells**.

That’s literally how every transaction works here!

### 🔹 How This Changed My Thinking
* It means I don’t “have a balance” anymore → I **own cells**.
* Sending CKB isn't subtracting a number; it's **restructuring cells**.
* Oh, and you can't just send 1 CKB around easily—there’s a minimum footprint for a usable cell (which I found out is roughly 61 CKB).

### 🔹 How Addresses Actually Work (Under the Hood)
I didn't just want to use an off-the-shelf wallet, so I implemented a wrapper around the derivation flow. It looks like this:
```text
mnemonic phrase → derived private key → public key → blake160 hash → lock script → actual CKB address
```
So when I “generate” a wallet, I’m really just building out that whole pipeline from scratch.

---

##  My Setup

If you want to run this code from the root (`Month-1/`) directory, just install dependencies:
```bash
npm install
```

---

##  Running A Local CKB Node
I didn't want to rely on public nodes for dev, so I wrote a script to spin up a local devnet and light client together:

```bash
cd week-1
chmod +x run-ckb-services.sh # Make it executable first!
./run-ckb-services.sh
```

It gives you a nice interactive prompt where you can select:
1. Start the CKB devnet
2. Setup and start the light client
3. Just start everything!

Once it fires up, the RPC proxy runs locally on `http://127.0.0.1:28114`, and I set it up to auto-save to my `.env` files so my scripts can just pick it up. Pure magic. ✨

---

## Building Wallets Work 

### Generating a Random Wallet
```bash
npm run wallet -- --random
```
Outputs the private key, the blake160 hash, and the fresh address.

### Generating a Mnemonic Wallet
```bash
npm run wallet -- --mnemonic
```
Spits out the mnemonic phrase, derived private key, and the address.

### Recovering From a Mnemonic
Messed up? Just restore it:
```bash
npm run wallet -- --from-mnemonic "word1 word2 word3 ..."
```
(You can also pass `--index 1` if you want a different derived address.)

### Using an Existing Private Key
```bash
npm run wallet -- --privateKey 0x...
```

---

##  Checking Balance

By Private Key:
```bash
npm run balance -- --privateKey 0xYOUR_PRIVATE_KEY
```

By Mnemonic:
```bash
npm run balance -- --from-mnemonic "word1 word2 ..."
```

---

##  Sending CKB (The Fun Part)

Using a Private Key:
```bash
npm run send -- --to ckt1... --amount 100 --privateKey 0xYOUR_PRIVATE_KEY
```

Using a Mnemonic:
```bash
npm run send -- --to ckt1... --amount 100 --from-mnemonic "word1 word2 ..."
```
*Note: If I don’t pass a `--from` address, the script is smart enough to derive it for me automatically. Pretty neat!*

---

## 📂 Quick Code Tour

Here is how I structured Week 1:
```text
week-1/
├── wallet.ts           # The wallet generation & derivation logic
├── balance.ts          # Checks balances using the indexer
├── sendCKB.ts          # Builds and signs the transaction
├── run-ckb-services.sh # Bash script to manage the local node
├── README.md           # You are here!
```

---

##  Things I Noticed
* **Minimum size limit**: You can't just transfer dust easily. The minimum transfer is around **61 CKB**.
* **It's all about Lock Scripts**: Everything completely revolves around the lock script mechanism, not standard accounts.

##  What I Actually Gained This Week
By the time the weekend hit, I could confidently:
* Explain the **CKB cell model** without breaking down.
* Derive addresses straight from a private key.
* Spin up standard and mnemonic wallets.
* Actually query the chain for balances.
* Build, sign, and send real transactions.
* Run a local CKB node without tearing my hair out.

