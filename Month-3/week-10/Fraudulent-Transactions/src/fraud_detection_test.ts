import { ccc } from "@ckb-ccc/shell";

// Helper function to convert capacity to number
function capacityToNumber(capacity: ccc.FixedPoint): number {
  // In @ckb-ccc/shell, capacity can be accessed differently
  if (typeof capacity === 'bigint') {
    return Number(capacity) / 100000000;
  }
  if (typeof capacity === 'string') {
    return parseInt(capacity, 16) / 100000000;
  }
  // Try to get raw value
  const raw = (capacity as any).value || (capacity as any).toString();
  return Number(raw) / 100000000;
}

// Comprehensive fraud detection for CKB transactions
interface FraudAlert {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  txHash?: string;
}

function detectFraud(tx: ccc.Transaction, txHash?: string): FraudAlert[] {
  const alerts: FraudAlert[] = [];
  
  // 1. WRONG WITNESS COUNT
  const expectedWitnesses = tx.inputs.length + 1;
  if (tx.witnesses.length !== expectedWitnesses && tx.inputs.length > 0) {
    alerts.push({
      type: 'WRONG_WITNESS_COUNT',
      severity: 'HIGH',
      details: `Expected ${expectedWitnesses} witnesses, got ${tx.witnesses.length}`,
      txHash
    });
  }
  
  // 2. MISSING/EMPTY SIGNATURES
  const emptyWitnesses = tx.witnesses.filter(w => !w || w === '0x');
  if (emptyWitnesses.length > 0) {
    alerts.push({
      type: 'MISSING_SIGNATURE',
      severity: 'CRITICAL',
      details: `${emptyWitnesses.length} empty witness(es) found`,
      txHash
    });
  }
  
  // 3. NO SIGNATURES AT ALL
  if (tx.witnesses.every(w => !w || w === '0x' ) && tx.inputs.length > 0) {
    alerts.push({
      type: 'NO_SIGNATURES',
      severity: 'CRITICAL',
      details: 'Transaction has 0 valid signatures',
      txHash
    });
  }
  
  // 4. DUST OUTPUTS
  const dustThreshold = 61; // CKB
  const dustOutputs: number[] = [];
  
  for (let i = 0; i < tx.outputs.length; i++) {
    const output = tx.outputs[i];
    let capacityNum = 0;
    
    // Try different ways to get capacity
    if (typeof output.capacity === 'bigint') {
      capacityNum = Number(output.capacity) / 100000000;
    } else if (typeof output.capacity === 'string') {
      if (output.capacity.startsWith('0x')) {
        capacityNum = parseInt(output.capacity, 16) / 100000000;
      } else {
        capacityNum = parseFloat(output.capacity);
      }
    } else if (output.capacity && typeof (output.capacity as any).toNumber === 'function') {
      capacityNum = (output.capacity as any).toNumber() / 100000000;
    } else {
      // Try to get as fixed point
      try {
        const fixedPoint = output.capacity as any;
        if (fixedPoint.value !== undefined) {
          capacityNum = Number(fixedPoint.value) / 100000000;
        }
      } catch (e) {
        console.warn(`Could not parse capacity for output ${i}`);
      }
    }
    
    if (capacityNum < dustThreshold && capacityNum > 0) {
      dustOutputs.push(i);
    }
  }
  
  if (dustOutputs.length > 0) {
    alerts.push({
      type: 'DUST_OUTPUTS',
      severity: dustOutputs.length > 100 ? 'HIGH' : 'MEDIUM',
      details: `${dustOutputs.length} output(s) below ${dustThreshold} CKB minimum`,
      txHash
    });
  }
  
  // 5. EXCESSIVE OUTPUTS (Spam)
  if (tx.outputs.length > 500) {
    alerts.push({
      type: 'SPAM_ATTACK',
      severity: 'HIGH',
      details: `${tx.outputs.length} outputs in single transaction`,
      txHash
    });
  }
  
  // 6. ZERO CAPACITY OUTPUTS
  const zeroCapacity: number[] = [];
  for (let i = 0; i < tx.outputs.length; i++) {
    const output = tx.outputs[i];
    let capacityNum = 0;
    
    if (typeof output.capacity === 'bigint') {
      capacityNum = Number(output.capacity);
    } else if (typeof output.capacity === 'string') {
      if (output.capacity.startsWith('0x')) {
        capacityNum = parseInt(output.capacity, 16);
      } else {
        capacityNum = parseFloat(output.capacity) * 100000000;
      }
    }
    
    if (capacityNum === 0) {
      zeroCapacity.push(i);
    }
  }
  
  if (zeroCapacity.length > 0) {
    alerts.push({
      type: 'ZERO_CAPACITY_OUTPUT',
      severity: 'HIGH',
      details: `${zeroCapacity.length} output(s) with 0 capacity`,
      txHash
    });
  }
  
  return alerts;
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
  // Add an input to make the witness count matter
  wrongWitnessTx.witnesses = []; // Wrong count if inputs exist
  const wrongAlerts = detectFraud(wrongWitnessTx);
  console.log(`Results: ${wrongAlerts.length} alerts`);
  wrongAlerts.forEach(a => console.log(`  - ${a.type}: ${a.details}`));
  
  // Test 5: Zero capacity outputs
  console.log("\n📋 Test 5: Zero Capacity Outputs");
  const zeroCapTx = ccc.Transaction.from({
    outputs: [
      { capacity: 0n, lock },
      { capacity: 10000000000n, lock }
    ]
  });
  const zeroAlerts = detectFraud(zeroCapTx);
  console.log(`Results: ${zeroAlerts.length} alerts (expected 1+)`);
  zeroAlerts.forEach(a => console.log(`  - ${a.type}: ${a.details}`));
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY:");
  console.log(`  Legitimate tx: ${legitAlerts.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Missing signatures: ${missingAlerts.length >= 2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Dust attack: ${dustAlerts.length >= 1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Zero capacity: ${zeroAlerts.length >= 1 ? '✅ PASS' : '❌ FAIL'}`);
}

// Run tests
runTests().catch(console.error);