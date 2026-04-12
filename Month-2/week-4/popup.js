/**
 * popup.js
 *
 * Entry point for the CKB Wallet extension popup.
 * Imports wallet/password/storage helpers and wires up all UI screens.
 *
 * Screen flow:
 *   Start → isPasswordSet?
 *     No  → screen-set-password
 *     Yes → screen-enter-password → correct? → hasKey?
 *                                                 No  → screen-setup
 *                                                 Yes → screen-wallet
 */

import QRCode from 'qrcode';
import { generatePrivateKey, getAddress, getBalance, sendCKB } from './privKey.ts';
import { setPassword, isPasswordSet, verifyPassword } from './password.ts';
import { saveKey, getKey, hasKey, clearAll } from './localStorage.ts';

// ── Helpers ────────────────────────────────────────────────────────────────

function show(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErr(id) { setErr(id, ''); }

// ── Wallet screen loader ───────────────────────────────────────────────────

async function loadWallet() {
  const privateKey = await getKey();
  if (!privateKey) return;

  const address = getAddress(privateKey);
  document.getElementById('wallet-address').textContent = address;
  document.getElementById('receive-address').textContent = address;
  document.getElementById('wallet-balance').textContent = '…';

  try {
    const balance = await getBalance(address);
    document.getElementById('wallet-balance').textContent = balance;
  } catch {
    document.getElementById('wallet-balance').textContent = 'Error';
  }
}

// ── Initialise ─────────────────────────────────────────────────────────────

async function init() {
  const pwSet = await isPasswordSet();
  show(pwSet ? 'screen-enter-password' : 'screen-set-password');
}

async function afterUnlock() {
  const wallet = await hasKey();
  if (!wallet) {
    show('screen-setup');
  } else {
    await loadWallet();
    show('screen-wallet');
  }
}

// ── Screen 1: Set Password ─────────────────────────────────────────────────

document.getElementById('btn-set-password').addEventListener('click', async () => {
  clearErr('error-set-password');
  const pw  = document.getElementById('input-new-password').value;
  const pw2 = document.getElementById('input-confirm-password').value;
  if (pw.length < 6) return setErr('error-set-password', 'Password must be at least 6 characters.');
  if (pw !== pw2)    return setErr('error-set-password', 'Passwords do not match.');
  await setPassword(pw);
  show('screen-setup');
});

document.getElementById('input-confirm-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-set-password').click();
});

// ── Screen 2: Enter Password ───────────────────────────────────────────────

document.getElementById('btn-unlock').addEventListener('click', async () => {
  clearErr('error-enter-password');
  const pw = document.getElementById('input-password').value;
  const ok = await verifyPassword(pw);
  if (!ok) return setErr('error-enter-password', 'Incorrect password.');
  await afterUnlock();
});

document.getElementById('input-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-unlock').click();
});

// ── Screen 3: Setup Wallet ─────────────────────────────────────────────────

function showResult(privateKey, address) {
  document.getElementById('generated-key').textContent     = privateKey;
  document.getElementById('generated-address').textContent = address;
  document.getElementById('setup-result').classList.remove('hidden');
}

document.getElementById('btn-generate').addEventListener('click', async () => {
  clearErr('error-setup');
  const privateKey = generatePrivateKey();
  const address    = getAddress(privateKey);
  await saveKey(privateKey);
  showResult(privateKey, address);
});

document.getElementById('btn-import').addEventListener('click', async () => {
  clearErr('error-setup');
  const pk = document.getElementById('input-import-key').value.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(pk)) {
    return setErr('error-setup', 'Invalid key — must be 0x followed by 64 hex characters.');
  }
  try {
    const address = getAddress(pk);
    await saveKey(pk);
    showResult(pk, address);
  } catch {
    setErr('error-setup', 'Could not derive address from this key.');
  }
});

document.getElementById('btn-continue').addEventListener('click', async () => {
  await loadWallet();
  show('screen-wallet');
});

// ── Screen 4: Main Wallet ──────────────────────────────────────────────────

// Copy address (header row)
document.getElementById('btn-copy-address').addEventListener('click', () => {
  const addr = document.getElementById('wallet-address').textContent;
  navigator.clipboard.writeText(addr);
  const btn = document.getElementById('btn-copy-address');
  btn.textContent = 'Copied!';
  setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
});

// Refresh balance
document.getElementById('btn-refresh-balance').addEventListener('click', async () => {
  document.getElementById('wallet-balance').textContent = '…';
  try {
    const privateKey = await getKey();
    const balance = await getBalance(getAddress(privateKey));
    document.getElementById('wallet-balance').textContent = balance;
  } catch {
    document.getElementById('wallet-balance').textContent = 'Error';
  }
});

// Lock
document.getElementById('btn-lock').addEventListener('click', () => {
  document.getElementById('input-password').value = '';
  clearErr('error-enter-password');
  show('screen-enter-password');
});

// Tabs
document.getElementById('tab-send').addEventListener('click', () => {
  document.getElementById('tab-send').classList.add('active');
  document.getElementById('tab-receive').classList.remove('active');
  document.getElementById('panel-send').classList.remove('hidden');
  document.getElementById('panel-receive').classList.add('hidden');
});

document.getElementById('tab-receive').addEventListener('click', async () => {
  document.getElementById('tab-receive').classList.add('active');
  document.getElementById('tab-send').classList.remove('active');
  document.getElementById('panel-receive').classList.remove('hidden');
  document.getElementById('panel-send').classList.add('hidden');

  const addr = document.getElementById('wallet-address').textContent;
  document.getElementById('receive-address').textContent = addr;
  await QRCode.toCanvas(
    document.getElementById('qr-canvas'),
    addr,
    { width: 200, margin: 2, color: { dark: '#000000', light: '#ffffff' } },
  );
});

// Copy address (receive panel)
document.getElementById('btn-copy-receive').addEventListener('click', () => {
  const addr = document.getElementById('receive-address').textContent;
  navigator.clipboard.writeText(addr);
  const btn = document.getElementById('btn-copy-receive');
  btn.textContent = 'Copied!';
  setTimeout(() => { btn.textContent = 'Copy Address'; }, 2000);
});

// Send CKB
document.getElementById('btn-send').addEventListener('click', async () => {
  const statusEl = document.getElementById('send-status');
  const toAddr   = document.getElementById('input-to').value.trim();
  const amount   = parseFloat(document.getElementById('input-amount').value);

  statusEl.className = 'msg error';

  if (!toAddr.startsWith('ckt1')) {
    statusEl.textContent = 'Enter a valid testnet address (starts with ckt1).';
    return;
  }
  if (!amount || amount < 61) {
    statusEl.textContent = 'Minimum amount is 61 CKB.';
    return;
  }

  const sendBtn = document.getElementById('btn-send');
  sendBtn.disabled = true;
  statusEl.className = 'msg';
  statusEl.textContent = 'Building transaction…';

  try {
    const privateKey = await getKey();
    const txHash = await sendCKB(privateKey, toAddr, amount);
    statusEl.className = 'msg success';
    statusEl.textContent = `Sent! TX: ${txHash.slice(0, 22)}…`;
    document.getElementById('input-to').value     = '';
    document.getElementById('input-amount').value = '';
    // Refresh balance after a short delay to let the node process the tx
    setTimeout(async () => {
      const balance = await getBalance(getAddress(privateKey));
      document.getElementById('wallet-balance').textContent = balance;
    }, 4000);
  } catch (e) {
    statusEl.className = 'msg error';
    statusEl.textContent = e?.message ?? 'Transaction failed.';
  } finally {
    sendBtn.disabled = false;
  }
});

// ── Boot ───────────────────────────────────────────────────────────────────
init();
