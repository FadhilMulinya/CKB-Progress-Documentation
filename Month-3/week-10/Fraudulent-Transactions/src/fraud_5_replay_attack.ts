import { ccc } from "@ckb-ccc/shell";

console.log("🔴 FRAUD 5: Replay Attack - Same signature on different transaction\n");

// This is a captured signature from a previous legitimate transaction
const capturedSignature = "0x5500000010000000550000005500000041000000de8d4ed2bb0b10592604f67946bf60acfbdac3ea0edcba1a44efdee696e332e92ca0a0cab6fc3eec647cdb34d23275efc017ad361ba137a8200f5f75c17ddf9c01";

const attackerAddress = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqflz4emgssc6nqj4yv3nfv2sca7g9dzhscgmg28x";
const { script: lock } = await ccc.Address.fromString(attackerAddress, new ccc.ClientPublicTestnet());

// Create a transaction that reuses the captured signature
const replayTx = ccc.Transaction.from({
  inputs: [
    {
      previousOutput: { 
        txHash: "0xdef456...", // DIFFERENT cell than the original!
        index: 0 
      },
      since: "0x0",
    },
  ],
  outputs: [
    {
      capacity: ccc.fixedPointFrom(90),
      lock: lock,
    },
  ],
  witnesses: [capturedSignature], // 🚨 REUSING SIGNATURE
});

console.log("🚨 Replay Attack Created");
console.log(`Reused signature: ${capturedSignature.substring(0, 50)}...\n`);

// Detection
const signatureHistory = new Map<string, string[]>();

function detectSignatureReplay(witness: string, txHash: string): boolean {
  if (!signatureHistory.has(witness)) {
    signatureHistory.set(witness, [txHash]);
    return false;
  }
  
  const previousTxs = signatureHistory.get(witness)!;
  previousTxs.push(txHash);
  return true;
}

// Check for replay
const isReplay = detectSignatureReplay(capturedSignature, replayTx.hash());

if (isReplay) {
  console.log("🚨 CRITICAL: Signature replay detected!");
  console.log("   Same signature appears in multiple transactions");
  console.log("   This is a replay attack attempt");
}