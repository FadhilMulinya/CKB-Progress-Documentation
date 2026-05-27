import { ccc } from "@ckb-ccc/shell";

interface FraudAlert {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  txHash?: string;
}

function parseCapacityShannons(capacity: any): bigint | null {
  if (capacity === null || capacity === undefined) {
    return null;
  }

  if (typeof capacity === 'bigint') {
    return capacity;
  }

  if (typeof capacity === 'number') {
    return BigInt(Math.floor(capacity));
  }

  if (typeof capacity === 'string') {
    try {
      return capacity.startsWith('0x') ? BigInt(capacity) : BigInt(Math.floor(Number(capacity)));
    } catch {
      return null;
    }
  }

  if (typeof capacity === 'object') {
    if ('value' in capacity) {
      return parseCapacityShannons((capacity as any).value);
    }
    if (typeof (capacity as any).toString === 'function') {
      return parseCapacityShannons((capacity as any).toString());
    }
  }

  return null;
}

function detectFraud(tx: ccc.Transaction, txHash?: string): FraudAlert[] {
  const alerts: FraudAlert[] = [];

  const expectedWitnesses = tx.inputs.length + 1;
  if (tx.inputs.length > 0 && tx.witnesses.length !== expectedWitnesses) {
    alerts.push({
      type: 'WRONG_WITNESS_COUNT',
      severity: 'HIGH',
      details: `Expected ${expectedWitnesses} witnesses, got ${tx.witnesses.length}`,
      txHash,
    });
  }

  const emptyWitnesses = tx.witnesses.filter(w => !w || w === '0x');
  if (emptyWitnesses.length > 0) {
    alerts.push({
      type: 'MISSING_SIGNATURE',
      severity: 'CRITICAL',
      details: `${emptyWitnesses.length} empty witness(es) found`,
      txHash,
    });
  }

  if (tx.inputs.length > 0 && tx.witnesses.every(w => !w || w === '0x')) {
    alerts.push({
      type: 'NO_SIGNATURES',
      severity: 'CRITICAL',
      details: 'Transaction has 0 valid signatures',
      txHash,
    });
  }

  const dustThreshold = 61; // CKB
  const dustOutputs: number[] = [];
  const zeroCapacityOutputs: number[] = [];

  for (let i = 0; i < tx.outputs.length; i++) {
    const shannons = parseCapacityShannons(tx.outputs[i].capacity);
    if (shannons === null) {
      continue;
    }

    const capacityCKB = Number(shannons) / 100000000;
    if (capacityCKB > 0 && capacityCKB < dustThreshold) {
      dustOutputs.push(i);
    }

    if (shannons === 0n) {
      zeroCapacityOutputs.push(i);
    }
  }

  if (dustOutputs.length > 0) {
    alerts.push({
      type: 'DUST_OUTPUTS',
      severity: dustOutputs.length > 100 ? 'HIGH' : 'MEDIUM',
      details: `${dustOutputs.length} output(s) below ${dustThreshold} CKB minimum`,
      txHash,
    });
  }

  if (tx.outputs.length > 500) {
    alerts.push({
      type: 'SPAM_ATTACK',
      severity: 'HIGH',
      details: `${tx.outputs.length} outputs in single transaction`,
      txHash,
    });
  }

  if (zeroCapacityOutputs.length > 0) {
    alerts.push({
      type: 'ZERO_CAPACITY_OUTPUT',
      severity: 'HIGH',
      details: `${zeroCapacityOutputs.length} output(s) with 0 capacity`,
      txHash,
    });
  }

  return alerts;
}

function createFakeInput(): ccc.CellInput {
  return ccc.CellInput.from({
    previousOutput: {
      txHash: '0x' + '0'.repeat(64),
      index: '0x0',
    },
    since: '0x0',
  });
}

// Test function
async function runTests() {
  console.log("🧪 Running Fraud Detection Test Suite\n");
  console.log("=".repeat(60));
  
  console.log("\n📋 Creating test address...");
  const testAddress = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqflz4emgssc6nqj4yv3nfv2sca7g9dzhscgmg28x";
  const client = new ccc.ClientPublicTestnet();
  const { script: lock } = await ccc.Address.fromString(testAddress, client);
  
  // Test 1: Legitimate transaction (should have 0 alerts)
  console.log("\n📋 Test 1: Legitimate Transaction");
  const legitTx = ccc.Transaction.from({
    outputs: [{ capacity: 10000000000n, lock }] // 100 CKB as bigint
  });
  const legitAlerts = detectFraud(legitTx);
  console.log(`Results: ${legitAlerts.length} alerts (expected 0)`);
  if (legitAlerts.length === 0) {
    console.log("  ✅ PASS");
  } else {
    console.log("  ❌ FAIL - Unexpected alerts");
    console.table(legitAlerts);
  }
  
  // Test 2: Missing signatures
  console.log("\n📋 Test 2: Missing Signatures");
  const missingSigTx = ccc.Transaction.from({
    outputs: [{ capacity: 10000000000n, lock }]
  });
  missingSigTx.inputs.push(createFakeInput());
  missingSigTx.witnesses = [];
  const missingAlerts = detectFraud(missingSigTx);
  console.log(`Results: ${missingAlerts.length} alerts (expected 2+)`);
  missingAlerts.forEach(a => console.log(`  - ${a.type}: ${a.details}`));
  if (missingAlerts.length >= 2) {
    console.log("  ✅ PASS");
  } else {
    console.log("  ❌ FAIL - Should have detected missing signatures");
  }
  
  // Test 3: Dust attack
  console.log("\n📋 Test 3: Dust Attack");
  const dustOutputs = [];
  for (let i = 0; i < 100; i++) {
    dustOutputs.push({ capacity: 100000000n, lock }); // 1 CKB - below 61 CKB threshold
  }
  const dustTx = ccc.Transaction.from({ outputs: dustOutputs });
  const dustAlerts = detectFraud(dustTx);
  console.log(`Results: ${dustAlerts.length} alerts (expected 1+)`);
  dustAlerts.forEach(a => console.log(`  - ${a.type}: ${a.details}`));
  if (dustAlerts.length >= 1) {
    console.log("  ✅ PASS");
  } else {
    console.log("  ❌ FAIL - Should have detected dust outputs");
  }
  
  // Test 4: Wrong witness count
  console.log("\n📋 Test 4: Wrong Witness Count");
  const wrongWitnessTx = ccc.Transaction.from({
    outputs: [{ capacity: 10000000000n, lock }]
  });
  wrongWitnessTx.inputs.push(createFakeInput());
  wrongWitnessTx.witnesses = ["0x"];
  const wrongAlerts = detectFraud(wrongWitnessTx);
  console.log(`Results: ${wrongAlerts.length} alerts`);
  wrongAlerts.forEach(a => console.log(`  - ${a.type}: ${a.details}`));
  
  // Test 5: Zero capacity outputs
  console.log("\n📋 Test 5: Zero Capacity Outputs");
  const zeroCapTx = ccc.Transaction.from({ outputs: [] });
  zeroCapTx.outputs.push(ccc.CellOutput.from({ capacity: 0n, lock }));
  zeroCapTx.outputs.push(ccc.CellOutput.from({ capacity: 10000000000n, lock }));
  const zeroAlerts = detectFraud(zeroCapTx);
  console.log(`Results: ${zeroAlerts.length} alerts (expected 1+)`);
  zeroAlerts.forEach(a => console.log(`  - ${a.type}: ${a.details}`));
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY:");
  console.log(`  Legitimate tx: ${legitAlerts.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Missing signatures: ${missingAlerts.length >= 2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Dust attack: ${dustAlerts.length >= 1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Wrong witness count: ${wrongAlerts.some(a => a.type === 'WRONG_WITNESS_COUNT') ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Zero capacity: ${zeroAlerts.length >= 1 ? '✅ PASS' : '❌ FAIL'}`);
}

// Run tests
runTests().catch(console.error);