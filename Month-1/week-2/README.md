# Week 2
### Payment Channels, Fiber Network & Taking Transactions Off-Chain

Alright, so Week 2 is where things started getting *really* interesting. I went deeper into the **Cell (UTXO) model**, finally explored **payment channels**, got my hands dirty with the **Fiber Network**, and even started wrapping my head around **Perun state channels**.

---

##  Lessons

### 1. Deeper Understanding of Cell Model
Last week, I saw CKB’s model as kind of just another version of Bitcoin's UTXO. This week, I finally understood why it’s actually so much more powerful.

* Every single transaction **consumes old cells and creates brand new ones**.
* There is no such thing as "updating state in place."
* State is always **replaced, never modified**.

When you really think about it, this totally changes how you design systems. Instead of telling the blockchain to "update my balance," you're essentially saying, "here's the old state, destroy it, and create this entirely new state representing what happens next." It’s profound, and it forms the whole foundation for everything else I learned this week.

### 2. Lock Scripts vs. Type Scripts
I finally got this straight in my head:
* **Lock Script** → Acts as the bouncer. It dictates *who* is allowed to unlock and spend the cell.
* **Type Script** → Acts as the rulebook. It dictates *what* the cell actually represents and what the rules are for transitioning its state.

This clear separation is what makes CKB programmable on a much deeper level than standard blockchains. You’re not just tossing tokens around; you’re setting up rigid logic rules.

### 3. Hello, Fiber Network
I started exploring the Fiber Network—which is essentially CKB's payment layer. 
* It’s built entirely on top of CKB.
* It totally takes inspiration from Bitcoin's Lightning Network.
* It allows for **blazing fast and super cheap off-chain payments**.
* But because of CKB's design, it supports way more **programmable assets**, not just simple native token transfers!

It’s not just a Lightning copycat; it extends the concept massively by leveraging the Cell Model.

### 4. How Fiber Payment Channels Actually Work
This is where the magic happens. Instead of paying gas fees and waiting for the blockchain every single time you want to transact:

* **Opening a Channel**: Funds get locked on-chain in a shared cell between participants. (Blockchain happens here).
* **Off-chain Transactions**: We just swap signed states back and forth locally. (Zero blockchain interaction here!).
* **Closing a Channel**: The absolute final state is agreed upon and submitted to the chain, and funds are divvied up. (Blockchain happens here).

Instead of `transaction → wait → repeat`, you get `transact freely → settle once`. The efficiency gains are just absurd.

### 5. Enter Perun (State Channels)
While Fiber focuses heavily on payment channels, Perun takes it to the next level: **State channels**.
The difference?
* **Payment channels (Fiber)** → Awesome for transferring value back and forth.
* **State channels (Perun)** → Awesome for transferring *any shared state* back and forth.

This means you can start building full-blown, complex off-chain applications, not just payment systems.

---

##  What I Built / Implemented


### Fiber Node Setup
I automated the hassle of setting up a Fiber node by building a script that:
* Installs all the necessary dependencies.
* Sets up the node automatically.
* Exports keys using `ckb-cli`.
* Fires up the node so it's ready to go.

### Driving Fiber with TypeScript
Using `curl` got old fast, so I wrote a suite of reusable TypeScript wrappers to:
* Grab the node info.
* List out all my open channels.
* Open new channels.
* Close channels gracefully.

### Putting it to the Test (Hackathon MVP!)
I actually participated in the **CKB CLAW Agents Hackathon**! I applied everything I had been learning to build my project: **Flawless (OmniFlow)**.

More details in end of Month 1 Report

---

## 🛠 Running My Fiber Scripts

If you want to play around with what I built, make sure you're in the `/Month-1` root directory and install everything:
```bash
npm install
```

Then you can run the scripts via npm:

**Get node info:**
```bash
npm run fiber:info
```
**List open channels:**
```bash
npm run fiber:channels
```
**Open a new channel:**
```bash
npm run fiber:open -- --peerId <PEER_ID> --amount 10000000000 --public true
```
**Close a channel:**
```bash
npm run fiber:close -- --channelId <CHANNEL_ID>
```

### Heads up on RPC Config!
My scripts need to know where your Fiber node RPC is hanging out. I export my local one like this:
```bash
export FIBER_RPC_URL=http://127.0.0.1:8227
```
(If you don't set it, the scripts will just lazily default to `http://127.0.0.1:8227` anyway!)

---



