import type { PaymentLinkParams, CompactPaymentPayload, ParsedPaymentLink } from './types.js';
import { signPayload, verifyPayloadSignature } from './signatures.js';

/**
 * PaymentLinks.ts
 * Logic for generating, parsing, and validating Signed CKB payment links (ckbl: prefix)
 */

const PREFIX_REGEX = /^[A-Z0-9]{3}$/;

export function validatePrefix(prefix: string): boolean {
    return PREFIX_REGEX.test(prefix);
}

/**
 * URL-safe Base64 encoding
 */
function toBase64Url(str: string): string {
    // browser environment: btoa
    try {
        return btoa(str)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    } catch (e) {
        // Fallback or Node.js if needed (though we are in an extension)
        return str;
    }
}

function fromBase64Url(str: string): string {
    try {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        return atob(str);
    } catch (e) {
        throw new Error('Invalid base64url encoding');
    }
}

export function encodePayload(payload: CompactPaymentPayload): string {
    return toBase64Url(JSON.stringify(payload));
}

export function decodePayload(encoded: string): CompactPaymentPayload {
    const json = fromBase64Url(encoded);
    return JSON.parse(json);
}

export function isPaymentLinkExpired(payload: CompactPaymentPayload): boolean {
    const expiryMs = payload.e * 60 * 60 * 1000;
    return Date.now() > (payload.i + expiryMs);
}

export async function generatePaymentLink(
    params: PaymentLinkParams,
    privateKey: string
): Promise<string> {
    if (!validatePrefix(params.prefix)) {
        throw new Error('Invalid prefix. Must be 3 alphanumeric characters.');
    }

    const payload: CompactPaymentPayload = {
        a: params.address,
        n: params.amount,
        t: params.asset,
        e: params.expiryHours,
        i: Date.now()
    };

    const signature = await signPayload(payload, privateKey);
    const encodedPayload = encodePayload(payload);
    const encodedSig = toBase64Url(signature);

    return `ckbl:${params.prefix}.${encodedPayload}.${encodedSig}`;
}

export async function parsePaymentLink(link: string): Promise<ParsedPaymentLink> {
    if (!link.startsWith('ckbl:')) {
        throw new Error('Invalid protocol. Must start with ckbl:');
    }

    const parts = link.substring(5).split('.');
    if (parts.length !== 3) {
        throw new Error('Malformed payment link. Expected PREFIX.PAYLOAD.SIG');
    }

    const [prefix, encodedPayload, encodedSig] = parts;

    try {
        const payload = decodePayload(encodedPayload);
        const signature = fromBase64Url(encodedSig);

        return {
            prefix,
            payload,
            signature
        };
    } catch (err) {
        throw new Error('Failed to decode payment link');
    }
}

export async function validatePaymentLink(link: string): Promise<boolean> {
    try {
        const { payload, signature } = await parsePaymentLink(link);

        // 1. Check expiry
        if (isPaymentLinkExpired(payload)) {
            console.warn('Payment link expired');
            return false;
        }

        // 2. Verify signature
        // We verify that the payload matches the signature.
        // Since it's self-custodial, the signer is the requester (payload.a).
        const isValid = await verifyPayloadSignature(payload, signature, payload.a);

        return isValid;
    } catch (err) {
        console.error('Validation error:', err);
        return false;
    }
}
