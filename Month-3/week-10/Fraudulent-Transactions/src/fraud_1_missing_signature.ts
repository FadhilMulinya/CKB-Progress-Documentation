import { ccc } from "@ckb-ccc/shell";

console.log("🔴 FRAUD 1: Missing Signature Attack\n");

// Create a fraudulent transaction builder
const fraudTxBuilder = (lock: ccc.Script) => {
  const tx = ccc.Transaction.from({
    outputs: [
      {
        capacity: ccc.fixedPointFrom(100),
        lock: lock,
      },
    ],
  });
  
  // 🚨 MANUALLY ADD INPUT WITHOUT SIGNATURE
  // This would normally require a signature
  
  return tx;
};

// Detection function
function detectFraud(tx: ccc.Transaction): Array<{
  type: string;
  severity: string;
  details: string;
}> {
  const alerts = [];
  
  // Check 1: Witness count
  const expectedWitnesses = tx.inputs.length + 1;
  if (tx.witnesses.length !== expectedWitnesses && tx.inputs.length > 0) {
    alerts.push({
      type: 'WRONG_WITNESS_COUNT',
      severity: 'HIGH',
      details: `Expected ${expectedWitnesses}, got ${tx.witnesses.length}`
    });
  }
  
  // Check 2: Empty witnesses
  const emptyWitnesses = tx.witnesses.filter(w => !w || w === '0x');
  if (emptyWitnesses.length > 0) {
    alerts.push({
      type: 'MISSING_SIGNATURE',
      severity: 'CRITICAL',
      details: `${emptyWitnesses.length} empty witness(es)`
    });
  }
  
  // Check 3: All witnesses empty
  if (tx.witnesses.every(w => !w || w === '0x') && tx.inputs.length > 0) {
    alerts.push({
      type: 'NO_SIGNATURES',
      severity: 'CRITICAL',
      details: 'Transaction has 0 valid signatures'
    });
  }
  
  return alerts;
}

// Create a transaction with missing signatures
console.log("Creating test transaction...");
const attackerAddress = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqflz4emgssc6nqj4yv3nfv2sca7g9dzhscgmg28x";
const { script: lock } = await ccc.Address.fromString(attackerAddress, new ccc.ClientPublicTestnet());

const tx = ccc.Transaction.from({
  outputs: [
    { capacity: ccc.fixedPointFrom(90), lock },
    { capacity: ccc.fixedPointFrom(10), lock },
  ],
});

console.log(`Inputs: ${tx.inputs.length}`);
console.log(`Outputs: ${tx.outputs.length}`);
console.log(`Witnesses: ${tx.witnesses.length}`);

// Manually corrupt - remove witnesses
tx.witnesses = [];

console.log("\n🚨 AFTER MANIPULATION:");
console.log(`Witnesses: ${tx.witnesses.length} (should be ${tx.inputs.length + 1})`);

// Run detection
const alerts = detectFraud(tx);
console.log("\n🔍 Detection Results:");
console.table(alerts);

console.log("\n✅ Expected: Node would reject this transaction");
console.log("Reason: No signatures provided for inputs");