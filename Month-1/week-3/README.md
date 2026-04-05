# Week 3 — Advanced Fiber Network Operations & Payments

This week, I didn't want to just stop at the basics. Building on what I learned in Week 2, I decided to dive completely into the deep end of the **Fiber Network**. I shifted my focus from simply opening and closing channels to managing a full-scale payment lifecycle and handling advanced peer network operations.

---

## What I Focused On this week

I spent my time building and implementing a complete suite of wrappers around the Fiber node RPC methods. These let me interact directly with my local Fiber node via RPC to manage everything that can happen during a payment channel's lifespan. 

Here is what I accomplished:

### 1. Peer Management (Making Connections)
If you want to transact off-chain, you need to actually maintain active peer connections. I wrote wrappers to handle this smoothly:
- Connecting to brand-new peers (`connectPeer.ts`).
- Gracefully disconnecting when done (`disconnectPeer.ts`).
- Listing out all my active peer connections to see who I'm talking to (`listPeer.ts`).
etc

### 2. Continued Channel Operations
Opening and closing channels is great, but what about the messy reality of running a node? 
- Seamlessly accepting incoming channel requests from other peers (`acceptChannel.ts`).
- Abandoning stale or violently failed channels (`abandonChannel.ts`).
- Safely and cleanly shutting down active channels when they're no longer needed (`shutDownChannel.ts`).

### 3. The Lifecycle of Invoices & Payments 
This is how value actually flows off the main chain! I wanted to handle the whole workflow natively:
- **Invoices**: Let's create new payment requests (`newInvoice.ts`), fetch details for existing ones (`getInvoice.ts`), parse raw invoice data (`parseInvoice.ts`), settle them up (`settleInvoice.ts`), and cancel them if someone flakes (`cancelInvoice.ts`).
- **Payments**: Actually sending CKB against a created invoice (`sendPayment.ts`) and pinging the network to verify if the payment went through (`getPayment.ts`).

---

## 🛠 Want to Run the Scripts?

If you're following along, you can run all these scripts directly from the `Month-1/` directory using npm. 

```bash
# Example: Creating a brand new invoice to request 1000 CKB
npm run fiber:newInvoice -- --amount 1000 --currency CKB --description "Because I'm awesome"

# Example: Actually paying an invoice
npm run fiber:sendPayment -- --invoice <THAT_LONG_INVOICE_STRING_HERE>
```

---
