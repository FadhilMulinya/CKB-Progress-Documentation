/**
 * sendCKB.ts
 * Transfer CKB from one address to another using private key or mnemonic
 *
 * Usage:
 *   npm run send -- --to ckt1... --amount 100 --privateKey 0xYOUR_PRIVATE_KEY
 *   npm run send -- --to ckt1... --amount 100 --from-mnemonic "word1 word2 ... word12"
 *   npm run send -- --to ckt1... --amount 100 --from-mnemonic "word1 ..." --index 1
 *   npm run send -- --from ckt1... --to ckt1... --amount 100 --privateKey 0x...
 */

import { hd, config, helpers, RPC, Indexer, commons } from "@ckb-lumos/lumos";
import type { Address, HexString } from "@ckb-lumos/lumos";
import { TESTNET } from "@ckb-lumos/lumos/config.js";

config.initializeConfig(TESTNET);

const CKB_RPC_URL =
  process.env.CKB_RPC_URL ||
  process.env.CKB_DEVNET_RPC_URL ||
  "https://testnet.ckb.dev/rpc";

const CKB_INDEXER_URL =
  process.env.CKB_INDEXER_URL ||
  "https://testnet.ckb.dev/indexer";

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

export function privateKeyFromMnemonic(
  phrase: string,
  addressIndex = 0,
): HexString {
  const seed = hd.mnemonic.mnemonicToSeedSync(phrase);
  const extendedPrivateKey = hd.ExtendedPrivateKey.fromSeed(seed);

  return extendedPrivateKey.privateKeyInfo(
    hd.AddressType.Receiving,
    addressIndex,
  ).privateKey as HexString;
}

export function getAddressFromPrivateKey(privateKey: HexString): string {
  const args = hd.key.privateKeyToBlake160(privateKey);
  const template = TESTNET.SCRIPTS["SECP256K1_BLAKE160"]!;

  const lockScript = {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args,
  };

  return helpers.encodeToAddress(lockScript);
}

export async function transferCKB(
  from: Address,
  to: Address,
  ckbAmount: number,
  privateKey: HexString,
): Promise<string> {
  if (!Number.isFinite(ckbAmount) || ckbAmount <= 0) {
    throw new Error("Amount must be a positive number");
  }

  const capacityInShannons = BigInt(Math.round(ckbAmount * 10 ** 8));

  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });

  txSkeleton = await commons.common.transfer(
    txSkeleton,
    [from],
    to,
    capacityInShannons,
  );

  txSkeleton = await commons.common.payFeeByFeeRate(txSkeleton, [from], 1000);
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);

  const message = txSkeleton.get("signingEntries").get(0)?.message;
  if (!message) {
    throw new Error("No signing entry found in transaction skeleton");
  }

  const sig = hd.key.signRecoverable(message, privateKey);
  const tx = helpers.sealTransaction(txSkeleton, [sig]);

  return rpc.sendTransaction(tx, "passthrough");
}

async function main() {
  const to = getArg("--to");
  const amountArg = getArg("--amount");
  const privateKeyArg = getArg("--privateKey");
  const mnemonicArg = getArg("--from-mnemonic");
  const fromArg = getArg("--from");
  const indexArg = getArg("--index");
  const addressIndex = indexArg ? Number(indexArg) : 0;

  if (!to) throw new Error("Missing --to");
  if (!amountArg) throw new Error("Missing --amount");

  if (Number.isNaN(addressIndex) || addressIndex < 0) {
    throw new Error("--index must be a non-negative number");
  }

  let privateKey: HexString;

  if (privateKeyArg) {
    privateKey = privateKeyArg as HexString;
  } else if (mnemonicArg) {
    privateKey = privateKeyFromMnemonic(mnemonicArg, addressIndex);
  } else {
    throw new Error("Provide either --privateKey or --from-mnemonic");
  }

  const from = (fromArg || getAddressFromPrivateKey(privateKey)) as Address;
  const amount = Number(amountArg);

  const txHash = await transferCKB(
    from,
    to as Address,
    amount,
    privateKey,
  );

  console.log("RPC URL:", CKB_RPC_URL);
  console.log("From:", from);
  console.log("To:", to);
  console.log("Amount (CKB):", amount);
  console.log("Transaction sent successfully.");
  console.log("Tx Hash:", txHash);
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});