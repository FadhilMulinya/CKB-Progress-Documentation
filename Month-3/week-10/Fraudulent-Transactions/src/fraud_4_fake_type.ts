import { ccc } from "@ckb-ccc/shell";

console.log("🔴 FRAUD 4: Fake Type Script - Unauthorized Token Mint\n");

const attackerAddress = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqflz4emgssc6nqj4yv3nfv2sca7g9dzhscgmg28x";
const { script: lock } = await ccc.Address.fromString(attackerAddress, new ccc.ClientPublicTestnet());

// Real SUDT code hash
const SUDT_CODE_HASH = "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4";

// 🚨 FRAUD: Fake type script args (pretending to be owner)
const fakeSudtType = ccc.Script.from({
  codeHash: SUDT_CODE_HASH,
  hashType: "type",
  args: "0x" + "ff".repeat(20), // Fake owner address
});

const tx = ccc.Transaction.from({
  outputs: [
    {
      capacity: ccc.fixedPointFrom(142), // Minimum for SUDT
      lock: lock,
      type: fakeSudtType,
    },
  ],
  outputsData: ["0x00000000000000000000000000000000000000000000000000000000000f4240"], // Trying to mint 1,000,000 tokens
});

console.log("📊 Fraud Transaction Details:");
console.log(`Type script args: ${fakeSudtType.args}`);
console.log(`Expected owner: 0x${"00".repeat(20)}`);
console.log(`🚨 Attacker used: ${fakeSudtType.args}\n`);

// Detection
const isFakeType = fakeSudtType.args !== "0x" + "00".repeat(20);

if (isFakeType) {
  console.log("🚨 FRAUD DETECTED: Unauthorized type script args");
  console.log("   This attempts to mint tokens without proper authorization");
  console.log("   Expected: Node rejects due to type script validation");
}

// Check if trying to mint tokens
const mintAmount = parseInt(tx.outputsData[0], 16);
if (mintAmount > 0) {
  console.log(`\n⚠️ Attempting to mint ${mintAmount} tokens`);
  console.log("   This should only be allowed by the token owner");
}