import { ccc } from "@ckb-ccc/shell";

console.log("🔴 FRAUD 2: Wrong Witness Count\n");

const attackerAddress = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqflz4emgssc6nqj4yv3nfv2sca7g9dzhscgmg28x";
const { script: lock } = await ccc.Address.fromString(attackerAddress, new ccc.ClientPublicTestnet());

// Create legitimate transaction to get proper structure
const legitTx = ccc.Transaction.from({
  outputs: [
    { capacity: ccc.fixedPointFrom(80), lock },
    { capacity: ccc.fixedPointFrom(20), lock },
  ],
});

// This would normally have proper witnesses after completion
// We'll create a fake witness array with wrong count
legitTx.witnesses = [
  "0x5500000010000000550000005500000041000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
]; // Only 1 witness for 1 input? Actually should be inputs+1

console.log(`Inputs: ${legitTx.inputs.length}`);
console.log(`Witnesses: ${legitTx.witnesses.length}`);
console.log(`Expected: ${legitTx.inputs.length + 1}\n`);

// Detection
const expectedWitnesses = legitTx.inputs.length + 1;
const isFraudulent = legitTx.witnesses.length !== expectedWitnesses;

if (isFraudulent) {
  console.log("🚨 FRAUD DETECTED: Witness count mismatch");
  console.log(`   Expected ${expectedWitnesses}, got ${legitTx.witnesses.length}`);
} else {
  console.log("✅ Transaction appears valid");
}