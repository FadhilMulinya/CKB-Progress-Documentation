# Week 5: Secure Payment Links & SDK Transition

This week marked a significant leap forward for my CKB Wallet Chrome Extension. I continued my experimentation and development, moving from the basic wallet foundation established in Week 4 to a more advanced, feature-rich, and **production-ready** application.

---

## �️ SDK Transition: From Lumos to CCC

A major technical decision this week was to diverge from the standard `ckb/lumos` SDK and fully embrace the **CCC (Common Knowledge Base Codebase) SDK**. 

- **Why CCC?**: It is widely used by the most prominent wallet developers and projects in the CKB ecosystem. 
- **Advanced Tooling**: CCC provides advanced tools and abstractions that simplified my implementation of complex cryptographic flows and onchain interactions, making the extension more robust and compatible with modern CKB standards.

---

## � Key Progress: Signed Payment Links

While Week 4 focused on the primary wallet setup (password protection, key generation, and basic CKB transfers), Week 5 was dedicated to implementing **Signed Payment Links**. This feature allows users to request payments securely without any backend dependency.

### 🛡️ Anatomy of a Payment Link
my implemented `ckbl:` protocol creates links that are completely **tamper-evident**. A link looks like this:

**`ckbl:<PREFIX>.<PAYLOAD>.<SIG>`**

- **PREFIX**: A 3-character user-defined alphanumeric prefix (e.g., `FAD`).
- **PAYLOAD**: A `base64url` encoded JSON containing the recipient `address`, `amount` (CKB), `asset` type, `expiry` hmys, and an `issuedAt` timestamp.
- **SIG**: A `base64url` encoded JSON of the official CCC **`Signature` object**, which includes the raw signature, the signer's identity (Public Key), and the `CkbSecp256k1` sign type.

### 🔄 The Lifecycle: Generation to Validation

1.  **Generation**:
    - The extension canonicalizes the payment data into a stable string.
    - It uses the CCC **`signer.signMessage`** method to generate a full cryptographic signature.
    - All components are encoded into a compact, URL-safe string.
2.  **Validation**:
    - Upon pasting or opening a link, the extension decodes and parses the components.
    - It reconstructs the `Signature` object and calls the native **`ccc.Signer.verifyMessage`** method.
    - It confirms that the recovered public key matches the recipient address in the payload.
    - Finally, it checks the expiry timestamp before autofilling the payment form.

---

## 💎 Outcome: Production Readiness

The development this week was exceptionally smooth. By aligning strictly with the **CCC SDK**, I have arrived at an architecture that is not just a prototype, but an **almost production-ready extension**. The combination of secure local password hashing and tamper-evident payment links makes this a highly secure self-custodial wallet solution.