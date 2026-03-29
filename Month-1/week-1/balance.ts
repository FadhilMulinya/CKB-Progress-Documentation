/**
 * balance.ts
 * CKB Wallet - Check balance from private key or mnemonic
 *
 * Usage:
 *   npm run balance -- --privateKey 0xYOUR_PRIVATE_KEY
 *   npm run balance -- --from-mnemonic "word1 word2 ... word12"
 *   npm run balance -- --from-mnemonic "word1 word2 ..." --index 1
 */

import { BI, Indexer, config, helpers, hd } from "@ckb-lumos/lumos";
import type { HexString } from "@ckb-lumos/base";
import { TESTNET } from "@ckb-lumos/lumos/config.js";

config.initializeConfig(TESTNET);

const CKB_RPC_URL =
  process.env.CKB_RPC_URL ||
  process.env.CKB_DEVNET_RPC_URL ||
  "https://testnet.ckb.dev/rpc";

const CKB_INDEXER_URL =
  process.env.CKB_INDEXER_URL ||
  "https://testnet.ckb.dev/indexer";

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

export async function getCapacities(address: string): Promise<BI> {
  const collector = indexer.collector({
    lock: helpers.parseAddress(address),
  });

  let capacities = BI.from(0);

  for await (const cell of collector.collect()) {
    capacities = capacities.add(cell.cellOutput.capacity);
  }

  return capacities;
}

export function formatCKB(shannons: BI): string {
  const value = shannons.toBigInt();
  const whole = value / 100000000n;
  const remainder = value % 100000000n;
  const decimals =
    remainder.toString().padStart(8, "0").replace(/0+$/, "") || "0";

  return `${whole}.${decimals}`;
}

async function main() {
  const privateKeyArg = getArg("--privateKey");
  const mnemonicArg = getArg("--from-mnemonic");
  const indexArg = getArg("--index");
  const addressIndex = indexArg ? Number(indexArg) : 0;

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

  const address = getAddressFromPrivateKey(privateKey);
  const balance = await getCapacities(address);

  console.log("RPC URL:", CKB_RPC_URL);
  console.log("Address:", address);
  console.log("Balance (Shannons):", balance.toString());
  console.log("Balance (CKB):", formatCKB(balance));
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});