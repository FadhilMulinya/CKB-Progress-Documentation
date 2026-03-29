

# Week 2 — Payment Channels, Fiber Network & Off-Chain Transactions

This week i ent deeper into the **Cell (UTXO) model**, explored **payment channels**, and started working with the **Fiber Network**, while also getting introduced to **Perun state channels**.


##  Lessons

### 1. Deeper Understanding of the Cell (UTXO) Model

At first, I saw CKB’s model as just another version of UTXO.

Now I understand what actually makes it powerful.

* Every transaction **consumes cells and creates new ones**
* There is no “updating state”
* State is always **replaced, not modified**

That changes how you design systems.

Instead of thinking:

> “update balance”

You think:

> “create a new state from the previous one”

That’s the foundation for everything else I learned this week.

---

### 2. Lock Scripts vs Type Scripts

This distinction is now clear to me:

* **Lock Script**
  → defines *who can unlock/spend a cell*

* **Type Script**
  → defines *what the cell represents*

This separation is what makes CKB programmable at a deeper level than typical blockchains.

You’re not just sending tokens — you’re defining rules.

---
### 3. Fiber Network (CKB’s Payment Layer)

I explored the Fiber Network as a practical implementation of payment channels.

My understanding of it:

* Built on top of CKB
* Inspired by the Lightning Network
* Enables **fast and low-cost off-chain payments**
* Supports **more programmable assets**, not just simple transfers

So it’s not just copying Lightning — it extends it using CKB’s design.

---
### 4. Fiber Payment Channels (Understanding)

This is where things started getting real.

Instead of sending transactions every time:

#### Opening a Channel

* Funds are locked on-chain between participants

#### Off-chain Transactions

* Participants exchange signed states
* No blockchain interaction happens here

#### Closing a Channel

* Final state is submitted on-chain
* Funds are distributed

So instead of:

> transaction → wait → repeat

You get:

> transact freely → settle once

That’s a massive shift in efficiency.

---

### 5. Perun (State Channels)

Perun introduces a more general concept:

> Off-chain state updates, not just payments.

Difference I understood:

* **Payment channels (Fiber)** → focused on value transfer
* **State channels (Perun)** → can represent any shared state

This is where things move from payments to full off-chain applications.

---

##  What I Built / Implemented



### Fiber Node Setup

* Built a **Fiber node setup script**
* Automated:

  * Installation of dependencies
  * Node setup
  * Key export using `ckb-cli`
  * Node startup

---

### Fiber Interaction via TypeScript

Instead of using curl, I created reusable scripts:

* Fetch node info
* List channels
* Open channels
* Close channels

This made interactions cleaner and reusable.

---

### Applying This in a Real Project

I participated in the **CKB CLAW Agents Hackathon**, where I applied most of what I learned.

I integrated these concepts into my project:

> **Flawless (OmniFlow)**

What I applied:

* Structured interactions with blockchain systems
* Agent-based workflows interacting with on-chain logic
* Better understanding of how to optimize execution using on-chain flows

This is where everything started making practical sense.

---

##  Running the Fiber Scripts

I structured Fiber interactions into TypeScript scripts so I can run them directly.

From Month-1 root , run the following

### Install dependencies

```bash
npm install
```

---

### Run scripts

```bash
npm run fiber:info
```

```bash
npm run fiber:channels
```

```bash
npm run fiber:open -- --peerId <PEER_ID> --amount 10000000000 --public true
```

```bash
npm run fiber:close -- --channelId <CHANNEL_ID>
```

---

##  Fiber RPC Configuration

These scripts connect to the Fiber node via RPC.

I set it like this:

```bash
export FIBER_RPC_URL=http://127.0.0.1:8227
```

If not set, it defaults to:

```text
http://127.0.0.1:8227
```

---

##  Key Insight

The biggest realization this week:

> CKB is not just UTXO — it’s programmable state built on UTXO.

* You don’t mutate state — you replace it
* Its not necessary to rely on on-chain execution — you can move logic off-chain for cheaper and faster execution.
* You don’t scale by increasing throughput — you scale by reducing on-chain usage

That’s the real design shift.

---
 It’s not about making transactions faster — it’s about changing how you think about state and execution.

---

