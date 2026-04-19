import * as cccModule from '@ckb-ccc/core';
import type { CompactPaymentPayload } from './types.js';

// Handle both named and default exports
const ccc = (cccModule as any).default || cccModule;
const cccClient = new ccc.ClientPublicTestnet();

/**
 * Signatures.ts
 * Cryptographic operations for signed payment links using official CCC SDK patterns.
 */

/**
 * Canonicalize payload into a stable string with fixed key ordering.
 */
export function canonicalizePayload(payload: CompactPaymentPayload): string {
    return `a=${payload.a}&n=${payload.n}&t=${payload.t}&e=${payload.e}&i=${payload.i}`;
}

/**
 * Sign payload using official SDK signer.signMessage method.
 * Returns the FULL Signature object as a JSON string.
 */
export async function signPayload(
    payload: CompactPaymentPayload,
    privateKey: string
): Promise<string> {
    const canonicalString = canonicalizePayload(payload);
    const signer = new ccc.SignerCkbPrivateKey(cccClient, privateKey);

    // signMessage returns { signature, identity, signType }
    const sigObj = await signer.signMessage(canonicalString);
    return JSON.stringify(sigObj);
}

/**
 * Verify payload signature using official SDK Signer.verifyMessage method.
 */
export async function verifyPayloadSignature(
    payload: CompactPaymentPayload,
    signatureJson: string,
    expectedSigner?: string
): Promise<boolean> {
    try {
        const canonicalString = canonicalizePayload(payload);
        const sigObj = JSON.parse(signatureJson);

        // 1. Official SDK Verification
        const ok = await ccc.Signer.verifyMessage(canonicalString, sigObj);
        if (!ok) return false;

        // 2. Derive address from identity (Public Key) using SignerCkbPublicKey
        // Identity in CKB Secp256k1 signatures is the public key hex.
        const signer = new ccc.SignerCkbPublicKey(cccClient, sigObj.identity);
        const recoveredAddress = await signer.getRecommendedAddress();

        const targetSigner = expectedSigner || payload.a;

        return recoveredAddress === targetSigner;
    } catch (error) {
        console.error('Signature verification failed:', error);
        return false;
    }
}
