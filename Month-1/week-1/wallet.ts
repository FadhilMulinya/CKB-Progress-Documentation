/**
 * wallet.ts
 *
 * CKB wallet helper for:
 * - random private key generation
 * - mnemonic generation
 * - deriving first HD private key from mnemonic
 * - deriving CKB testnet address from private key
 *
 * Usage:
 *   npm run wallet -- --random
 *   npm run wallet -- --mnemonic
 *   npm run wallet -- --from-mnemonic "word1 word2 ... word12"
 *   npm run wallet -- --privateKey 0xYOUR_PRIVATE_KEY
 */

import { randomBytes } from "node:crypto";
import { hd, config, helpers } from "@ckb-lumos/lumos";
import type { HexString } from "@ckb-lumos/base";

const { mnemonic, ExtendedPrivateKey, AddressType } = hd;

// Use Nervos testnet (Aggron4)
config.initializeConfig(config.predefined.AGGRON4);

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

export function generateRandomPrivateKey(): HexString {
  return `0x${randomBytes(32).toString("hex")}`;
}

export function generateMnemonic(): string {
  return mnemonic.generateMnemonic();
}

export function privateKeyFromMnemonic(
  phrase: string,
  addressIndex = 0,
): HexString {
  const seed = mnemonic.mnemonicToSeedSync(phrase);
  const extendedPrivateKey = ExtendedPrivateKey.fromSeed(seed);

  return extendedPrivateKey.privateKeyInfo(
    AddressType.Receiving,
    addressIndex,
  ).privateKey as HexString;
}

export function getAddressFromPrivateKey(privateKey: HexString): string {
  const args = hd.key.privateKeyToBlake160(privateKey);
  const template = config.predefined.AGGRON4.SCRIPTS["SECP256K1_BLAKE160"]!;

  const lockScript = {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args,
  };

  return helpers.encodeToAddress(lockScript);
}

export function getBlake160FromPrivateKey(privateKey: HexString): HexString {
  return hd.key.privateKeyToBlake160(privateKey);
}

function printWalletDetails(privateKey: HexString) {
  const blake160 = getBlake160FromPrivateKey(privateKey);
  const address = getAddressFromPrivateKey(privateKey);

  console.log("Private Key:", privateKey);
  console.log("Blake160 / Lock Args:", blake160);
  console.log("CKB Testnet Address:", address);
}

function printUsage() {
  console.log("Usage:");
  console.log("  npm run wallet -- --random");
  console.log("  npm run wallet -- --mnemonic");
  console.log('  npm run wallet -- --from-mnemonic "word1 word2 ... word12"');
  console.log("  npm run wallet -- --privateKey 0xYOUR_PRIVATE_KEY");
  console.log("");
  console.log("Optional:");
  console.log("  --index <n>   Derivation index for mnemonic-based wallet (default: 0)");
}

async function main() {
  const existingMnemonic = getArg("--from-mnemonic");
  const privateKeyArg = getArg("--privateKey");
  const indexArg = getArg("--index");
  const addressIndex = indexArg ? Number(indexArg) : 0;

  if (Number.isNaN(addressIndex) || addressIndex < 0) {
    throw new Error("--index must be a non-negative number");
  }

  if (hasFlag("--random")) {
    console.log("=== Random Private Key Wallet ===");
    const privateKey = generateRandomPrivateKey();
    printWalletDetails(privateKey);
    return;
  }

  if (hasFlag("--mnemonic")) {
    console.log("=== New Mnemonic Wallet ===");
    const phrase = generateMnemonic();
    const privateKey = privateKeyFromMnemonic(phrase, addressIndex);

    console.log("Mnemonic:", phrase);
    console.log("Address Index:", addressIndex);
    printWalletDetails(privateKey);
    return;
  }

  if (existingMnemonic) {
    console.log("=== Existing Mnemonic Wallet ===");
    const privateKey = privateKeyFromMnemonic(existingMnemonic, addressIndex);

    console.log("Mnemonic:", existingMnemonic);
    console.log("Address Index:", addressIndex);
    printWalletDetails(privateKey);
    return;
  }

  if (privateKeyArg) {
    console.log("=== Existing Private Key Wallet ===");
    printWalletDetails(privateKeyArg as HexString);
    return;
  }

  printUsage();
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});