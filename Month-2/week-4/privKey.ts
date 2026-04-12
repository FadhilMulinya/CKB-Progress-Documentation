/**
 * privKey.ts
 *
 * Browser-compatible CKB wallet functions.
 * Adapted from Month-1/week-1/wallet.ts and sendCKB.ts:
 *   - generatePrivateKey: uses crypto.getRandomValues instead of Node's randomBytes
 *   - getAddress / getBalance / sendCKB: same lumos logic, bundled for browser by Parcel
 */

import { hd, config, helpers, RPC, Indexer, commons } from "@ckb-lumos/lumos";
import { TESTNET } from "@ckb-lumos/lumos/config.js";

config.initializeConfig(TESTNET);

const RPC_URL = "https://testnet.ckb.dev/rpc";
const INDEXER_URL = "https://testnet.ckb.dev/indexer";

// Browser-native key generation — no Node.js crypto needed
export function generatePrivateKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return "0x" + [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Derives CKB testnet address from private key (same logic as Month 1)
export function getAddress(privateKey: string): string {
  const args = hd.key.privateKeyToBlake160(privateKey as `0x${string}`);
  const { CODE_HASH, HASH_TYPE } = TESTNET.SCRIPTS["SECP256K1_BLAKE160"]!;
  return helpers.encodeToAddress({
    codeHash: CODE_HASH,
    hashType: HASH_TYPE,
    args,
  });
}

// Queries the testnet indexer directly via fetch — returns formatted CKB string
export async function getBalance(address: string): Promise<string> {
  const lock = helpers.parseAddress(address);
  const res = await fetch(INDEXER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "get_cells_capacity",
      params: [{
        script: {
          code_hash: lock.codeHash,
          hash_type: lock.hashType,
          args: lock.args,
        },
        script_type: "lock",
      }],
    }),
  });
  const json = await res.json() as { result: { capacity: string } };
  const shannons = BigInt(json.result.capacity);
  const whole = shannons / 100_000_000n;
  const rem = shannons % 100_000_000n;
  const dec = rem.toString().padStart(8, "0").replace(/0+$/, "") || "0";
  return `${whole}.${dec}`;
}

// Builds, signs, and broadcasts a CKB transfer (mirrors Month-1/week-1/sendCKB.ts exactly)
export async function sendCKB(
  privateKey: string,
  toAddress: string,
  ckbAmount: number,
): Promise<string> {
  const rpc = new RPC(RPC_URL);
  const indexer = new Indexer(INDEXER_URL, RPC_URL);
  const fromAddress = getAddress(privateKey);
  const capacity = BigInt(Math.round(ckbAmount * 1e8));

  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  txSkeleton = await commons.common.transfer(txSkeleton, [fromAddress], toAddress, capacity);
  txSkeleton = await commons.common.payFeeByFeeRate(txSkeleton, [fromAddress], 1000);
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);

  const message = txSkeleton.get("signingEntries").get(0)!.message;
  const sig = hd.key.signRecoverable(message, privateKey);
  const tx = helpers.sealTransaction(txSkeleton, [sig]);
  return rpc.sendTransaction(tx, "passthrough");
}
