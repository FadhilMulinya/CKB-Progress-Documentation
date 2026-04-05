# Month 1 — CKB Foundations & The Fiber Network

Welcome to my Month 1 progress! This first month was really all about laying down a solid foundation. I dove headfirst into **Nervos CKB** and the **Fiber Network**, starting from the absolute basics of how the Cell Model works, all the way up to writing code that interacts with Fiber Network.

Here’s a quick breakdown of how the month went:

---

## Month 1 Progress Overview

### [Week 1: Getting My CKB Foundations Right (Wallets, Cells & Nodes)](./week-1/README.md)
The biggest hurdle this week was wrapping my head around CKB's unique **Cell Model**. If you're coming from Ethereum like I was, you have to forget the account model. 
- **What clicked for me**: I realized transactions aren't about mutating state; they’re about consuming old state and creating new state. Oh, and grasping capacity, lock scripts, and type scripts was a game-changer!
- **What I actually built**: 
  - Some neat scripts to generate random and mnemonic wallets.
  - Tools to check balances and spin up/send CKB transactions.
  - A handy little devnet manager so I could run CKB services locally without a headache.

### [Week 2: Dipping into Payment Channels & The Fiber Network](./week-2/README.md)
This is where things got really fun. I moved from on-chain stuff to off-chain scaling. It’s not just about transferring tokens faster; it’s about *programmable state*.
- **What clicked for me**: I finally understood CKB Scaling solutions, **Fiber Network** and got a taste of more general state channels through **Perun**. The big realization? You don't scale by throwing more transactions at the blockchain; you scale by doing less on-the network.
- **What I actually built**: 
  - Automated tools to set up my Fiber node quickly.
  - Scripts to grab node info and play around with opening and closing payment channels.
  - I also  participated in the **Nervos CKB Open Agentic Hackathon**.  
    During the hackathon, I built **Flawless** (which you might also see referred to as OmniFlow). It’s essentially a low-code no-code for building AI agents infrastructure. If you want to poke around the code, you can check out the GitHub repo right here: [FadhilMulinya/Omniflow](https://github.com/FadhilMulinya/Omniflow).

    I managed to attract some users twho were intrested in using Flawless to build and create their own AI agents.

### [Week 3: Leveling Up in Fiber Network](./week-3/README.md)
Building on Week 2, I wanted to go beyond just opening a channel and calling it a day. I wanted a fully functional setup.
- **What clicked for me**: I got a much better grasp on peer-to-peer off-chain communication, how the whole channel lifecycle works, and how invoices actually drive the payments under the hood.
- **What I actually built**: 
  - Advanced scripts to gracefully accept, abandon, or even forcefully shut down channels.
  - Lifecycle scripts to manage peer connections.
  - A sweet suite of tools to create, parse, cancel, and settle invoices, plus actually sending and receiving payments.

--- 

# Just to Note

I continued building flawless as most of the information i was directly getting i was using it to build flawless. 


## The Biggest Thing I Learned in Month 1
If I had to narrow it down to one thing: CKB isn't just "UTXO but faster." It is **programmable state built natively on UTXO**. The way it separates **Lock Scripts** (who owns it) from **Type Scripts** (what the rules are) makes the base layer insanely powerful for building off-chain networks like Fiber. 
