/**
 * Type definitions for the CKB Wallet
 */

export interface WalletState {
    isUnlocked: boolean;
    hasWallet: boolean;
    currentScreen: ScreenType;
}

export type ScreenType =
    | 'screen-set-password'
    | 'screen-enter-password'
    | 'screen-setup'
    | 'screen-wallet'
    | 'screen-export-pk';

export interface TransactionResult {
    success: boolean;
    txHash?: string;
    error?: string;
}

export interface BalanceResult {
    success: boolean;
    balance?: string;
    error?: string;
}

export interface AddressResult {
    success: boolean;
    address?: string;
    error?: string;
}

// Chrome storage types
export interface ChromeStorage {
    ckb_pw?: string;
    ckb_key?: string;
}

// Signed Payment Link types
export type AssetType = "CKB";

export interface PaymentLinkParams {
    prefix: string;
    address: string;
    amount: number;
    asset: AssetType;
    expiryHours: number;
}

export interface CompactPaymentPayload {
    a: string; // address
    n: number; // amount
    t: AssetType; // asset
    e: number; // expiry hours
    i: number; // issued-at timestamp
}

export interface ParsedPaymentLink {
    prefix: string;
    payload: CompactPaymentPayload;
    signature: string;
}