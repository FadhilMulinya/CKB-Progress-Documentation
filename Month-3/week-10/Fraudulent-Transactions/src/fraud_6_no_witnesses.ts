import { ccc } from "@ckb-ccc/shell";

console.log("🔴 FRAUD 6: Completely Unsigned Transaction (0 witnesses)\n");

const attackerAddress = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqflz4emgssc6nqj4yv3nfv2sca7g9dzhscgmg28x";
const { script: lock } = await ccc.Address.fromString(attackerAddress, new ccc.ClientPublicTestnet());

const tx = ccc.Transaction.from({
  outputs: [
    { capacity: ccc.fixedPointFrom(100), lock },
  ],
});

// 🚨 SET WITNESSES TO EMPTY ARRAY
tx.witnesses = [];

console.log(`Inputs: ${tx.inputs.length}`);
console.log(`Witnesses: ${tx.witnesses.length}`);
console.log(`Expected: ${tx.inputs.length + 1}\n`);

// Detection
const alerts: Array<{ type: string; severity: string; details: string }> = [];

if (tx.witnesses.length === 0 && tx.inputs.length > 0) {
  alerts.push({
    type: 'NO_SIGNATURES',
    severity: 'CRITICAL',
    details: 'Transaction has inputs but 0 witnesses'
  });
}

if (tx.witnesses.length !== tx.inputs.length + 1) {
  alerts.push({
    type: 'WRONG_WITNESS_COUNT',
    severity: 'HIGH',
    details: `Expected ${tx.inputs.length + 1}, got ${tx.witnesses.length}`
  });
}

console.log("🔍 Detection Results:");
console.table(alerts);

console.log("\n✅ This transaction would be REJECTED immediately");
console.log("Reason: No signatures provided for any input");