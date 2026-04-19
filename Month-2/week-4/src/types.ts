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

// Payment Link types
export interface PaymentLinkParams {
    address: string;
    amount?: number;
    label?: string;
    message?: string;
    asset: 'CKB';
    v: number;
}