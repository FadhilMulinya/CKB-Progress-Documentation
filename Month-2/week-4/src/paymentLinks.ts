import type { PaymentLinkParams } from './types.js';

/**
 * PaymentLinks.ts
 * Logic for generating, parsing, and validating CKB payment links (ckb: URI scheme)
 */

export function generatePaymentLink(params: PaymentLinkParams): string {
    const url = new URL(`ckb:${params.address}`);

    if (params.amount) {
        url.searchParams.set('amount', params.amount.toString());
    }
    if (params.label) {
        url.searchParams.set('label', params.label);
    }
    if (params.message) {
        url.searchParams.set('message', params.message);
    }

    url.searchParams.set('asset', params.asset);
    url.searchParams.set('v', params.v.toString());

    // URL constructor might add // after ckb: depending on environment, 
    // but the spec for these typically doesn't have them.
    // Let's manually construct to ensure it follows the requirement.
    const query = url.search;
    return `ckb:${params.address}${query}`;
}

export function parsePaymentLink(link: string): PaymentLinkParams {
    if (!link.startsWith('ckb:')) {
        throw new Error('Invalid protocol. Must start with ckb:');
    }

    const [addressPart, queryPart] = link.substring(4).split('?');
    const params = new URLSearchParams(queryPart || '');

    const amount = params.get('amount');

    return {
        address: addressPart,
        amount: amount ? parseFloat(amount) : undefined,
        label: params.get('label') || undefined,
        message: params.get('message') || undefined,
        asset: (params.get('asset') as 'CKB') || 'CKB',
        v: parseInt(params.get('v') || '1')
    };
}

export function validatePaymentLink(link: string): boolean {
    try {
        if (!link.startsWith('ckb:')) return false;

        const [address] = link.substring(4).split('?');
        // Simple CKB testnet address validation
        if (!address.startsWith('ckt1')) return false;

        return true;
    } catch {
        return false;
    }
}
