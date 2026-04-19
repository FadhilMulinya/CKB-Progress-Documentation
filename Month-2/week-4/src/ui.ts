import QRCode from 'qrcode';
import { setPassword, isPasswordSet, verifyPassword } from './password.js';
import { saveKey, getKey, hasKey } from './localStorage.js';
import { generatePrivateKey, getAddress, getBalance, sendCKB } from './ckb.js';
import { generatePaymentLink, parsePaymentLink, validatePaymentLink } from './paymentLinks.js';
import type { ScreenType, PaymentLinkParams, AssetType } from './types.js';

/**
 * UI Controller - handles all DOM interactions and event listeners
 */

// DOM Elements interface
interface DOMElements {
    screens: Record<ScreenType, HTMLElement | null>;
    buttons: Record<string, HTMLElement | null>;
    inputs: Record<string, HTMLInputElement | null>;
    selects: Record<string, HTMLSelectElement | null>;
    displays: Record<string, HTMLElement | null>;
}

class CKBWalletUI {
    private elements: DOMElements;

    constructor() {
        this.elements = {
            screens: {
                'screen-set-password': document.getElementById('screen-set-password'),
                'screen-enter-password': document.getElementById('screen-enter-password'),
                'screen-setup': document.getElementById('screen-setup'),
                'screen-wallet': document.getElementById('screen-wallet'),
                'screen-export-pk': document.getElementById('screen-export-pk')
            },
            buttons: {
                setPassword: document.getElementById('btn-set-password'),
                unlock: document.getElementById('btn-unlock'),
                generate: document.getElementById('btn-generate'),
                import: document.getElementById('btn-import'),
                continue: document.getElementById('btn-continue'),
                copyAddress: document.getElementById('btn-copy-address'),
                refreshBalance: document.getElementById('btn-refresh-balance'),
                lock: document.getElementById('btn-lock'),
                tabSend: document.getElementById('tab-send'),
                tabReceive: document.getElementById('tab-receive'),
                tabRequest: document.getElementById('tab-request'),
                send: document.getElementById('btn-send'),
                copyReceive: document.getElementById('btn-copy-receive'),
                genRequest: document.getElementById('btn-gen-request'),
                copyReqLink: document.getElementById('btn-copy-req-link'),
                actionSend: document.getElementById('action-btn-send'),
                actionReceive: document.getElementById('action-btn-receive'),
                showPK: document.getElementById('btn-show-pk'),
                revealPK: document.getElementById('btn-reveal-pk'),
                backWallet: document.getElementById('btn-back-wallet')
            },
            inputs: {
                newPassword: document.getElementById('input-new-password') as HTMLInputElement,
                confirmPassword: document.getElementById('input-confirm-password') as HTMLInputElement,
                password: document.getElementById('input-password') as HTMLInputElement,
                importKey: document.getElementById('input-import-key') as HTMLInputElement,
                toAddress: document.getElementById('input-to') as HTMLInputElement,
                amount: document.getElementById('input-amount') as HTMLInputElement,
                paymentLink: document.getElementById('input-payment-link') as HTMLInputElement,
                reqAmount: document.getElementById('input-req-amount') as HTMLInputElement,
                reqPrefix: document.getElementById('input-req-prefix') as HTMLInputElement,
                reqExpiry: document.getElementById('input-req-expiry') as HTMLInputElement,
                verifyPKPassword: document.getElementById('input-verify-pw') as HTMLInputElement
            },
            selects: {
                reqAsset: document.getElementById('select-req-asset') as HTMLSelectElement,
            },
            displays: {
                walletAddress: document.getElementById('wallet-address'),
                receiveAddress: document.getElementById('receive-address'),
                walletBalance: document.getElementById('wallet-balance'),
                generatedKey: document.getElementById('generated-key'),
                generatedAddress: document.getElementById('generated-address'),
                setupResult: document.getElementById('setup-result'),
                sendStatus: document.getElementById('send-status'),
                qrCanvas: document.getElementById('qr-canvas') as HTMLCanvasElement,
                reqQRCanvas: document.getElementById('request-qr-canvas') as HTMLCanvasElement,
                reqQRArea: document.getElementById('request-qr-area'),
                displayPaymentLink: document.getElementById('display-payment-link'),
                displayPK: document.getElementById('display-pk'),
                pkResultArea: document.getElementById('pk-result-area')
            }
        };

        this.init();
    }

    private showScreen(screenId: ScreenType): void {
        Object.values(this.elements.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });

        const targetScreen = this.elements.screens[screenId];
        if (targetScreen) targetScreen.classList.add('active');
    }

    private switchTab(tabId: 'send' | 'receive' | 'request'): void {
        const panels = ['panel-send', 'panel-receive', 'panel-request'];
        const tabs = ['tab-send', 'tab-receive', 'tab-request'];

        panels.forEach(p => document.getElementById(p)?.classList.add('hidden'));
        tabs.forEach(t => document.getElementById(t)?.classList.remove('active'));

        document.getElementById(`panel-${tabId}`)?.classList.remove('hidden');
        document.getElementById(`tab-${tabId}`)?.classList.add('active');

        // If switching to receive, refresh QR
        if (tabId === 'receive') {
            this.refreshReceiveQR();
        }
    }

    private async refreshReceiveQR(): Promise<void> {
        const addr = this.elements.displays.walletAddress?.textContent || '';
        if (this.elements.displays.receiveAddress) {
            this.elements.displays.receiveAddress.textContent = addr;
        }

        try {
            if (this.elements.displays.qrCanvas) {
                await QRCode.toCanvas(
                    this.elements.displays.qrCanvas,
                    addr,
                    { width: 200, margin: 2, color: { dark: '#000000', light: '#ffffff' } }
                );
            }
        } catch (error) {
            console.error('QR generation failed:', error);
        }
    }

    private setError(elementId: string, message: string): void {
        const errorEl = document.getElementById(elementId);
        if (errorEl) errorEl.textContent = message;
    }

    private clearError(elementId: string): void {
        this.setError(elementId, '');
    }

    private async loadWallet(): Promise<void> {
        const privateKey = await getKey();
        if (!privateKey) return;

        const address = await getAddress(privateKey);
        if (this.elements.displays.walletAddress) {
            this.elements.displays.walletAddress.textContent = address;
        }
        if (this.elements.displays.receiveAddress) {
            this.elements.displays.receiveAddress.textContent = address;
        }

        if (this.elements.displays.walletBalance) {
            this.elements.displays.walletBalance.textContent = '…';
        }

        try {
            const balance = await getBalance(address);
            if (this.elements.displays.walletBalance) {
                this.elements.displays.walletBalance.textContent = balance;
            }
        } catch (error) {
            console.error('Failed to load balance:', error);
            if (this.elements.displays.walletBalance) {
                this.elements.displays.walletBalance.textContent = 'Error';
            }
        }
    }

    private async afterUnlock(): Promise<void> {
        if (!(await hasKey())) {
            this.showScreen('screen-setup');
        } else {
            await this.loadWallet();
            this.showScreen('screen-wallet');
        }
    }

    private showResult(privateKey: string, address: string): void {
        if (this.elements.displays.generatedKey) {
            this.elements.displays.generatedKey.textContent = privateKey;
        }
        if (this.elements.displays.generatedAddress) {
            this.elements.displays.generatedAddress.textContent = address;
        }
        if (this.elements.displays.setupResult) {
            this.elements.displays.setupResult.classList.remove('hidden');
        }
    }

    private setupEventListeners(): void {
        // Screen 1: Set Password
        this.elements.buttons.setPassword?.addEventListener('click', async () => {
            this.clearError('error-set-password');
            const pw = this.elements.inputs.newPassword?.value || '';
            const pw2 = this.elements.inputs.confirmPassword?.value || '';

            if (pw.length < 6) {
                this.setError('error-set-password', 'Password must be at least 6 characters.');
                return;
            }
            if (pw !== pw2) {
                this.setError('error-set-password', 'Passwords do not match.');
                return;
            }

            await setPassword(pw);
            this.showScreen('screen-setup');
        });

        this.elements.inputs.confirmPassword?.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') this.elements.buttons.setPassword?.dispatchEvent(new Event('click'));
        });

        // Screen 2: Enter Password
        this.elements.buttons.unlock?.addEventListener('click', async () => {
            this.clearError('error-enter-password');
            const pw = this.elements.inputs.password?.value || '';
            const ok = await verifyPassword(pw);

            if (!ok) {
                this.setError('error-enter-password', 'Incorrect password.');
                return;
            }

            await this.afterUnlock();
        });

        this.elements.inputs.password?.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') this.elements.buttons.unlock?.dispatchEvent(new Event('click'));
        });

        // Screen 3: Setup Wallet
        this.elements.buttons.generate?.addEventListener('click', async () => {
            this.clearError('error-setup');
            const privateKey = generatePrivateKey();
            const address = await getAddress(privateKey);
            await saveKey(privateKey);
            this.showResult(privateKey, address);
        });

        this.elements.buttons.import?.addEventListener('click', async () => {
            this.clearError('error-setup');
            const pk = this.elements.inputs.importKey?.value.trim() || '';

            if (!/^0x[0-9a-fA-F]{64}$/.test(pk)) {
                this.setError('error-setup', 'Invalid key — must be 0x followed by 64 hex characters.');
                return;
            }

            try {
                const address = await getAddress(pk);
                await saveKey(pk);
                this.showResult(pk, address);
            } catch (error) {
                console.error('Import failed:', error);
                this.setError('error-setup', 'Could not derive address from this key.');
            }
        });

        this.elements.buttons.continue?.addEventListener('click', async () => {
            await this.loadWallet();
            this.showScreen('screen-wallet');
        });

        // Screen 4: Main Wallet
        this.elements.buttons.copyAddress?.addEventListener('click', () => {
            const addr = this.elements.displays.walletAddress?.textContent || '';
            navigator.clipboard.writeText(addr);
            const btn = this.elements.buttons.copyAddress;
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = '✓ Copied!';
                setTimeout(() => { if (btn) btn.textContent = originalText; }, 2000);
            }
        });

        this.elements.buttons.refreshBalance?.addEventListener('click', async () => {
            if (this.elements.displays.walletBalance) {
                this.elements.displays.walletBalance.textContent = '…';
            }
            try {
                const privateKey = await getKey();
                if (privateKey) {
                    const address = await getAddress(privateKey);
                    const balance = await getBalance(address);
                    if (this.elements.displays.walletBalance) {
                        this.elements.displays.walletBalance.textContent = balance;
                    }
                }
            } catch (error) {
                console.error('Refresh failed:', error);
                if (this.elements.displays.walletBalance) {
                    this.elements.displays.walletBalance.textContent = 'Error';
                }
            }
        });

        this.elements.buttons.lock?.addEventListener('click', () => {
            if (this.elements.inputs.password) this.elements.inputs.password.value = '';
            this.clearError('error-enter-password');
            this.showScreen('screen-enter-password');
        });

        // Quick Action Buttons (Icon Buttons)
        this.elements.buttons.actionSend?.addEventListener('click', () => this.switchTab('send'));
        this.elements.buttons.actionReceive?.addEventListener('click', () => this.switchTab('receive'));

        // Tabs
        this.elements.buttons.tabSend?.addEventListener('click', () => this.switchTab('send'));
        this.elements.buttons.tabReceive?.addEventListener('click', () => this.switchTab('receive'));
        this.elements.buttons.tabRequest?.addEventListener('click', () => this.switchTab('request'));

        // PK Export
        this.elements.buttons.showPK?.addEventListener('click', () => {
            this.clearError('error-export-pk');
            if (this.elements.inputs.verifyPKPassword) this.elements.inputs.verifyPKPassword.value = '';
            this.elements.displays.pkResultArea?.classList.add('hidden');
            this.showScreen('screen-export-pk');
        });

        this.elements.buttons.revealPK?.addEventListener('click', async () => {
            this.clearError('error-export-pk');
            const pw = this.elements.inputs.verifyPKPassword?.value || '';
            const ok = await verifyPassword(pw);

            if (!ok) {
                this.setError('error-export-pk', 'Incorrect password.');
                return;
            }

            const pk = await getKey();
            if (pk && this.elements.displays.displayPK) {
                this.elements.displays.displayPK.textContent = pk;
                this.elements.displays.pkResultArea?.classList.remove('hidden');
            }
        });

        this.elements.buttons.backWallet?.addEventListener('click', () => {
            this.showScreen('screen-wallet');
        });

        this.elements.buttons.copyReceive?.addEventListener('click', () => {
            const addr = this.elements.displays.receiveAddress?.textContent || '';
            navigator.clipboard.writeText(addr);
            const btn = this.elements.buttons.copyReceive;
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = '✓ Copied!';
                setTimeout(() => { if (btn) btn.textContent = originalText; }, 2000);
            }
        });

        // Payment Link Import
        this.elements.inputs.paymentLink?.addEventListener('input', async (e) => {
            const val = (e.target as HTMLInputElement).value.trim();
            if (val.startsWith('ckbl:')) {
                const isValid = await validatePaymentLink(val);
                if (isValid) {
                    try {
                        const { payload } = await parsePaymentLink(val);
                        if (this.elements.inputs.toAddress) this.elements.inputs.toAddress.value = payload.a;
                        if (this.elements.inputs.amount) this.elements.inputs.amount.value = payload.n.toString();

                        if (this.elements.displays.sendStatus) {
                            this.elements.displays.sendStatus.classList.remove('hidden');
                            this.elements.displays.sendStatus.className = 'msg success';
                            this.elements.displays.sendStatus.textContent = `Signed link verified! Asset: ${payload.t}`;
                        }
                    } catch (err) {
                        console.error('Parse failed', err);
                    }
                } else {
                    if (this.elements.displays.sendStatus) {
                        this.elements.displays.sendStatus.classList.remove('hidden');
                        this.elements.displays.sendStatus.className = 'msg error';
                        this.elements.displays.sendStatus.textContent = 'Invalid or expired signed link.';
                    }
                }
            }
        });

        // Generate Request Link
        this.elements.buttons.genRequest?.addEventListener('click', async () => {
            const addr = this.elements.displays.walletAddress?.textContent || '';
            const amount = parseFloat(this.elements.inputs.reqAmount?.value || '0');
            const prefix = this.elements.inputs.reqPrefix?.value.trim().toUpperCase() || 'CKB';
            const expiryHours = parseInt(this.elements.inputs.reqExpiry?.value || '24');
            const asset = (this.elements.selects.reqAsset?.value as AssetType) || 'CKB';

            if (!prefix || prefix.length !== 3) {
                alert('Prefix must be exactly 3 characters.');
                return;
            }

            if (amount <= 0) {
                alert('Amount must be greater than 0.');
                return;
            }

            try {
                const privateKey = await getKey();
                if (!privateKey) throw new Error('Wallet locked or not initialized');

                const link = await generatePaymentLink({
                    prefix,
                    address: addr,
                    amount,
                    asset,
                    expiryHours
                }, privateKey);

                if (this.elements.displays.displayPaymentLink) {
                    this.elements.displays.displayPaymentLink.textContent = link;
                }

                this.elements.displays.reqQRArea?.classList.remove('hidden');

                try {
                    if (this.elements.displays.reqQRCanvas) {
                        await QRCode.toCanvas(
                            this.elements.displays.reqQRCanvas,
                            link,
                            { width: 180, margin: 2, color: { dark: '#000000', light: '#ffffff' } }
                        );
                    }
                } catch (qrError) {
                    console.error('QR generation for request failed:', qrError);
                }
            } catch (error) {
                console.error('Request generation failed:', error);
            }
        });

        this.elements.buttons.copyReqLink?.addEventListener('click', () => {
            const link = this.elements.displays.displayPaymentLink?.textContent || '';
            navigator.clipboard.writeText(link);
            const btn = this.elements.buttons.copyReqLink;
            if (btn) {
                btn.textContent = '✓ Copied!';
                setTimeout(() => { if (btn) btn.textContent = 'Copy Link'; }, 2000);
            }
        });

        // Send Transaction
        this.elements.buttons.send?.addEventListener('click', async () => {
            const statusEl = this.elements.displays.sendStatus;
            const toAddr = this.elements.inputs.toAddress?.value.trim() || '';
            const amount = parseFloat(this.elements.inputs.amount?.value || '0');

            if (statusEl) {
                statusEl.classList.remove('hidden');
                statusEl.className = 'msg error';
            }

            if (!toAddr.startsWith('ckt1')) {
                if (statusEl) statusEl.textContent = 'Enter a valid testnet address (starts with ckt1).';
                return;
            }
            if (!amount || amount < 61) {
                if (statusEl) statusEl.textContent = 'Minimum amount is 61 CKB.';
                return;
            }

            if (this.elements.buttons.send) {
                (this.elements.buttons.send as HTMLButtonElement).disabled = true;
            }

            if (statusEl) {
                statusEl.className = 'msg';
                statusEl.textContent = '⏳ Building transaction…';
            }

            try {
                const privateKey = await getKey();
                if (!privateKey) throw new Error('No private key found');

                const txHash = await sendCKB(privateKey, toAddr, amount);
                if (statusEl) {
                    statusEl.className = 'msg success';
                    statusEl.textContent = `✅ Sent! TX: https://testnet.explorer.nervos.org/transaction/${txHash.slice(0, 22)}…`;
                }

                if (this.elements.inputs.toAddress) this.elements.inputs.toAddress.value = '';
                if (this.elements.inputs.amount) this.elements.inputs.amount.value = '';
                if (this.elements.inputs.paymentLink) this.elements.inputs.paymentLink.value = '';

                setTimeout(async () => {
                    const address = await getAddress(privateKey);
                    const balance = await getBalance(address);
                    if (this.elements.displays.walletBalance) {
                        this.elements.displays.walletBalance.textContent = balance;
                    }
                }, 4000);
            } catch (error) {
                console.error('Send failed:', error);
                if (statusEl) {
                    statusEl.className = 'msg error';
                    statusEl.textContent = (error as Error)?.message ?? 'Transaction failed.';
                }
            } finally {
                if (this.elements.buttons.send) {
                    (this.elements.buttons.send as HTMLButtonElement).disabled = false;
                }
            }
        });
    }

    private async init(): Promise<void> {
        this.setupEventListeners();
        const pwSet = await isPasswordSet();
        this.showScreen(pwSet ? 'screen-enter-password' : 'screen-set-password');
    }
}

// Initialize the UI
new CKBWalletUI();