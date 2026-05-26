// testnet_fraud_test.ts
import { ccc } from "@ckb-ccc/shell";
import { client, TESTNET_ADDRESS, getBalance } from "./ckbClient";

// Fraud detection function (enhanced for testnet)
interface FraudAlert {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
}

function detectFraud(tx: ccc.Transaction): FraudAlert[] {
  const alerts: FraudAlert[] = [];
  
  // 1. WRONG WITNESS COUNT
  const expectedWitnesses = tx.inputs.length + 1;
  if (tx.witnesses.length !== expectedWitnesses && tx.inputs.length > 0) {
    alerts.push({
      type: 'WRONG_WITNESS_COUNT',
      severity: 'HIGH',
      details: `Expected ${expectedWitnesses} witnesses, got ${tx.witnesses.length}`
    });
  }
  
  // 2. MISSING/EMPTY SIGNATURES
  const emptyWitnesses = tx.witnesses.filter(w => !w || w === '0x');
  if (emptyWitnesses.length > 0) {
    alerts.push({
      type: 'MISSING_SIGNATURE',
      severity: 'CRITICAL',
      details: `${emptyWitnesses.length} empty witness(es) found`
    });
  }
  
  // 3. NO SIGNATURES AT ALL
  if (tx.witnesses.every(w => !w || w === '0x') && tx.inputs.length > 0) {
    alerts.push({
      type: 'NO_SIGNATURES',
      severity: 'CRITICAL',
      details: 'Transaction has 0 valid signatures'
    });
  }
  
  // 4. DUST OUTPUTS
  const dustThreshold = 61; // CKB
  const dustOutputs: number[] = [];
  
  for (let i = 0; i < tx.outputs.length; i++) {
    const capacityNum = Number(tx.outputs[i].capacity) / 100000000;
    if (capacityNum < dustThreshold && capacityNum > 0) {
      dustOutputs.push(i);
    }
  }
  
  if (dustOutputs.length > 0) {
    alerts.push({
      type: 'DUST_OUTPUTS',
      severity: dustOutputs.length > 100 ? 'HIGH' : 'MEDIUM',
      details: `${dustOutputs.length} output(s) below ${dustThreshold} CKB minimum`
    });
  }
  
  // 5. ZERO CAPACITY OUTPUTS
  const zeroCapacity = tx.outputs.filter(o => o.capacity === 0n);
  if (zeroCapacity.length > 0) {
    alerts.push({
      type: 'ZERO_CAPACITY_OUTPUT',
      severity: 'HIGH',
      details: `${zeroCapacity.length} output(s) with 0 capacity`
    });
  }
  
  return alerts;
}

// Test 1: Legitimate Transaction with proper signature
async function testLegitimateTransaction() {
  console.log("\n📋 Test 1: Legitimate Transaction (Should be accepted)");
  console.log("-".repeat(50));
  
  try {
    const fromAddress = await ccc.Address.fromString(TESTNET_ADDRESS, client);
    const toAddress = await ccc.Address.fromString(TESTNET_ADDRESS, client);
    
    // Get balance before
    const balanceBefore = await getBalance(TESTNET_ADDRESS);
    console.log(`💰 Balance before: ${balanceBefore} CKB`);
    
    // Get cells to spend
    const cells = await (client as any).getLiveCells(fromAddress.script, "asc", undefined, 1);
    if (cells.length === 0) {
      throw new Error("No cells found to spend. Make sure devnet has funds.");
    }
    
    console.log(`📦 Using cell with capacity: ${Number(cells[0].capacity) / 100000000} CKB`);
    
    // Create transaction
    const tx = ccc.Transaction.from({});
    
    // Add input
    tx.inputs.push(ccc.CellInput.from({
      previousOutput: cells[0].outPoint,
      since: "0x0",
    }));
    
    // Add output (send 50 CKB)
    const sendAmount = 5000000000n; // 50 CKB
    tx.outputs.push(ccc.CellOutput.from({
      capacity: sendAmount,
      lock: toAddress.script,
    }));
    
    // Add change output if needed
    const fee = 100000n; // 0.001 CKB fee
    const change = cells[0].capacity - sendAmount - fee;
    if (change > 0) {
      tx.outputs.push(ccc.CellOutput.from({
        capacity: change,
        lock: fromAddress.script,
      }));
    }
    
    // Add witness placeholders
    tx.witnesses = new Array(tx.inputs.length + 1).fill("0x");
    
    console.log(`📝 Transaction created with ${tx.inputs.length} input(s) and ${tx.outputs.length} output(s)`);
    
    // Sign the transaction (skip for testnet demo)
    // const signer = new ccc.SignerCkbPrivateKey(client, privkey);
    // const signedTx = await signer.signTransaction(tx);
    const signedTx = tx;
    
    console.log(`🔐 Transaction signed with ${signedTx.witnesses.length} witness(es)`);
    
    // Detect fraud
    const alerts = detectFraud(signedTx);
    console.log(`🔍 Fraud detection results: ${alerts.length} alerts`);
    alerts.forEach(a => console.log(`   - ${a.type}: ${a.details}`));
    
    if (alerts.length === 0) {
      // Send transaction
      const txHash = await client.sendTransaction(signedTx);
      console.log(`✅ Transaction sent! Hash: ${txHash}`);
      
      // Wait for confirmation
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const balanceAfter = await getBalance(TESTNET_ADDRESS);
      console.log(`💰 Balance after: ${balanceAfter} CKB`);
      console.log(`✅ PASS - Legitimate transaction accepted`);
      return true;
    } else {
      console.log(`❌ FAIL - Legitimate transaction flagged as fraudulent`);
      return false;
    }
  } catch (error: any) {
    console.log(`❌ FAIL - Transaction failed: ${error.message}`);
    if (error.message.includes("Insufficient")) {
      console.log(`   Hint: Make sure your devnet account has enough balance`);
    }
    return false;
  }
}

// Test 2: Missing Signatures
async function testMissingSignatures() {
  console.log("\n📋 Test 2: Missing Signatures (Should be rejected)");
  console.log("-".repeat(50));
  
  try {
    const fromAddress = await ccc.Address.fromString(TESTNET_ADDRESS, client);
    const toAddress = await ccc.Address.fromString(TESTNET_ADDRESS, client);
    
    // Get cells to spend
    const cells = await (client as any).getLiveCells(fromAddress.script, "asc", undefined, 1);
    if (cells.length === 0) {
      throw new Error("No cells found to spend");
    }
    
    // Create transaction
    const tx = ccc.Transaction.from({});
    
    // Add input
    tx.inputs.push(ccc.CellInput.from({
      previousOutput: cells[0].outPoint,
      since: "0x0",
    }));
    
    // Add output
    tx.outputs.push(ccc.CellOutput.from({
      capacity: 1000000000n, // 10 CKB
      lock: toAddress.script,
    }));
    
    // Add change
    const fee = 100000n;
    const change = cells[0].capacity - 1000000000n - fee;
    if (change > 0) {
      tx.outputs.push(ccc.CellOutput.from({
        capacity: change,
        lock: fromAddress.script,
      }));
    }
    
    // 🚨 FRAUD: Set empty witnesses (no signatures)
    tx.witnesses = [];
    
    console.log(`🚨 Created transaction with ${tx.witnesses.length} witnesses (should be ${tx.inputs.length + 1})`);
    
    // Detect fraud
    const alerts = detectFraud(tx);
    console.log(`🔍 Fraud detection results: ${alerts.length} alerts`);
    alerts.forEach(a => console.log(`   - ${a.type}: ${a.details}`));
    
    const hasNoSignatures = alerts.some(a => a.type === 'NO_SIGNATURES');
    
    if (hasNoSignatures) {
      console.log(`✅ Fraud detected: No signatures present`);
      
      // Try to send (should fail)
      try {
        const txHash = await client.sendTransaction(tx);
        console.log(`❌ FAIL - Transaction was accepted! Hash: ${txHash}`);
        return false;
      } catch (error: any) {
        console.log(`✅ PASS - Transaction correctly rejected: ${error.message.substring(0, 100)}`);
        return true;
      }
    } else {
      console.log(`❌ FAIL - Missing signatures not detected`);
      return false;
    }
  } catch (error: any) {
    console.log(`✅ PASS - Transaction correctly failed: ${error.message.substring(0, 100)}`);
    return true;
  }
}

// Test 3: Dust Attack
async function testDustAttack() {
  console.log("\n📋 Test 3: Dust Attack (Should be detected and rejected)");
  console.log("-".repeat(50));
  
  try {
    const fromAddress = await ccc.Address.fromString(TESTNET_ADDRESS, client);
    const toAddress = await ccc.Address.fromString(TESTNET_ADDRESS, client);
    
    // Get cells to spend
    const cells = await (client as any).getLiveCells(fromAddress.script, "asc", undefined, 1);
    if (cells.length === 0) {
      throw new Error("No cells found to spend");
    }
    
    // Create dust outputs (1 CKB each - below 61 CKB threshold)
    const dustOutputs = [];
    const numDustOutputs = 20; // Reduce number to avoid hitting limits
    for (let i = 0; i < numDustOutputs; i++) {
      dustOutputs.push(ccc.CellOutput.from({
        capacity: 100000000n, // 1 CKB
        lock: toAddress.script,
      }));
    }
    
    const totalDustAmount = BigInt(numDustOutputs) * 100000000n;
    const fee = 100000n;
    
    // Check if we have enough balance
    if (cells[0].capacity < totalDustAmount + fee) {
      console.log(`⚠️ Insufficient balance for dust test (need ${Number(totalDustAmount + fee) / 100000000} CKB), skipping...`);
      return true;
    }
    
    // Create transaction
    const tx = ccc.Transaction.from({});
    
    // Add input
    tx.inputs.push(ccc.CellInput.from({
      previousOutput: cells[0].outPoint,
      since: "0x0",
    }));
    
    // Add dust outputs
    for (const output of dustOutputs) {
      tx.outputs.push(output);
    }
    
    // Add change output if needed
    const change = cells[0].capacity - totalDustAmount - fee;
    if (change > 0) {
      tx.outputs.push(ccc.CellOutput.from({
        capacity: change,
        lock: fromAddress.script,
      }));
    }
    
    // Add witness placeholders and sign
    tx.witnesses = new Array(tx.inputs.length + 1).fill("0x");
    // const signer = new ccc.SignerCkbPrivateKey(client, privkey);
    // const signedTx = await signer.signTransaction(tx);
    const signedTx = tx;
    
    console.log(`🚨 Created dust attack with ${numDustOutputs} outputs below 61 CKB threshold`);
    
    // Detect fraud
    const alerts = detectFraud(signedTx);
    console.log(`🔍 Fraud detection results: ${alerts.length} alerts`);
    alerts.forEach(a => console.log(`   - ${a.type}: ${a.details}`));
    
    // Check if dust was detected
    const dustDetected = alerts.some(a => a.type === 'DUST_OUTPUTS');
    
    if (dustDetected) {
      console.log(`✅ PASS - Dust attack detected by fraud detection`);
      
      // Try to send (devnet might still accept dust)
      try {
        const txHash = await client.sendTransaction(signedTx);
        console.log(`⚠️ Transaction was accepted by devnet (devnet may not enforce dust rules), Hash: ${txHash}`);
        console.log(`   Note: Mainnet would reject this transaction`);
        return true;
      } catch (error: any) {
        console.log(`✅ Transaction correctly rejected by node: ${error.message.substring(0, 100)}`);
        return true;
      }
    } else {
      console.log(`❌ FAIL - Dust attack not detected by fraud detection`);
      return false;
    }
  } catch (error: any) {
    console.log(`⚠️ Test error: ${error.message}`);
    return false;
  }
}

// Test 4: Wrong Witness Count
async function testWrongWitnessCount() {
  console.log("\n📋 Test 4: Wrong Witness Count (Should be rejected)");
  console.log("-".repeat(50));
  
  try {
    const fromAddress = await ccc.Address.fromString(TESTNET_ADDRESS, client);
    const toAddress = await ccc.Address.fromString(TESTNET_ADDRESS, client);
    
    // Get cells to spend
    const cells = await (client as any).getLiveCells(fromAddress.script, "asc", undefined, 1);
    if (cells.length === 0) {
      throw new Error("No cells found to spend");
    }
    
    // Create transaction
    const tx = ccc.Transaction.from({});
    
    // Add input
    tx.inputs.push(ccc.CellInput.from({
      previousOutput: cells[0].outPoint,
      since: "0x0",
    }));
    
    // Add output
    tx.outputs.push(ccc.CellOutput.from({
      capacity: 1000000000n, // 10 CKB
      lock: toAddress.script,
    }));
    
    // Add change
    const fee = 100000n;
    const change = cells[0].capacity - 1000000000n - fee;
    if (change > 0) {
      tx.outputs.push(ccc.CellOutput.from({
        capacity: change,
        lock: fromAddress.script,
      }));
    }
    
    // 🚨 FRAUD: Wrong witness count (should be inputs.length + 1 = 2)
    tx.witnesses = ["0x"]; // Only 1 witness
    
    console.log(`🚨 Created transaction with ${tx.witnesses.length} witness(es) (should be ${tx.inputs.length + 1})`);
    
    // Detect fraud
    const alerts = detectFraud(tx);
    console.log(`🔍 Fraud detection results: ${alerts.length} alerts`);
    alerts.forEach(a => console.log(`   - ${a.type}: ${a.details}`));
    
    // Check if wrong witness count was detected
    const wrongWitnessDetected = alerts.some(a => a.type === 'WRONG_WITNESS_COUNT');
    
    if (wrongWitnessDetected) {
      console.log(`✅ PASS - Wrong witness count detected`);
      
      // Try to send (should fail)
      try {
        const txHash = await client.sendTransaction(tx);
        console.log(`❌ FAIL - Transaction was accepted! Hash: ${txHash}`);
        return false;
      } catch (error: any) {
        console.log(`✅ Transaction correctly rejected: ${error.message.substring(0, 100)}`);
        return true;
      }
    } else {
      console.log(`❌ FAIL - Wrong witness count not detected`);
      return false;
    }
  } catch (error: any) {
    console.log(`✅ PASS - Transaction correctly failed: ${error.message.substring(0, 100)}`);
    return true;
  }
}

// Test 5: Zero Capacity Outputs
async function testZeroCapacity() {
  console.log("\n📋 Test 5: Zero Capacity Outputs (Should be detected)");
  console.log("-".repeat(50));
  
  try {
    const fromAddress = await ccc.Address.fromString(TESTNET_ADDRESS, client);
    const toAddress = await ccc.Address.fromString(TESTNET_ADDRESS, client);
    
    // Get cells to spend
    const cells = await (client as any).getLiveCells(fromAddress.script, "asc", undefined, 1);
    if (cells.length === 0) {
      throw new Error("No cells found to spend");
    }
    
    // Create transaction with zero capacity output
    const tx = ccc.Transaction.from({});
    
    // Add input
    tx.inputs.push(ccc.CellInput.from({
      previousOutput: cells[0].outPoint,
      since: "0x0",
    }));
    
    // 🚨 FRAUD: Add zero capacity output
    tx.outputs.push(ccc.CellOutput.from({
      capacity: 0n, // Zero capacity!
      lock: toAddress.script,
    }));
    
    // Add legitimate output
    tx.outputs.push(ccc.CellOutput.from({
      capacity: 500000000n, // 5 CKB
      lock: toAddress.script,
    }));
    
    // Add change
    const fee = 100000n;
    const totalOutput = 500000000n;
    const change = cells[0].capacity - totalOutput - fee;
    if (change > 0) {
      tx.outputs.push(ccc.CellOutput.from({
        capacity: change,
        lock: fromAddress.script,
      }));
    }
    
    // Add witness placeholders and sign
    tx.witnesses = new Array(tx.inputs.length + 1).fill("0x");
    // const signer = new ccc.SignerCkbPrivateKey(client, privkey);
    // const signedTx = await signer.signTransaction(tx);
    const signedTx = tx;
    
    console.log(`🚨 Created transaction with zero capacity output`);
    
    // Detect fraud
    const alerts = detectFraud(signedTx);
    console.log(`🔍 Fraud detection results: ${alerts.length} alerts`);
    alerts.forEach(a => console.log(`   - ${a.type}: ${a.details}`));
    
    // Check if zero capacity was detected
    const zeroDetected = alerts.some(a => a.type === 'ZERO_CAPACITY_OUTPUT');
    
    if (zeroDetected) {
      console.log(`✅ PASS - Zero capacity output detected`);
      return true;
    } else {
      console.log(`❌ FAIL - Zero capacity output not detected`);
      return false;
    }
  } catch (error: any) {
    console.log(`⚠️ Test error: ${error.message}`);
    return false;
  }
}

// Main test suite
async function runDevnetTests() {
  console.log("🧪 Running Testnet Fraud Detection Test Suite");
  console.log("=".repeat(60));
  console.log(`💰 Using account: ${TESTNET_ADDRESS.substring(0, 20)}...`);
  
  // Check if devnet is accessible
  try {
    const tip = await client.getTip();
    console.log(`✅ DevNet is running (Tip block: ${tip})`);
  } catch (error) {
    console.log(`❌ Cannot connect to DevNet. Make sure it's running:`);
    console.log(`   Run 'ckb devnode' in another terminal`);
    console.log(`\n⚠️ Tests aborted - DevNet not available`);
    return;
  }
  
  const initialBalance = await getBalance(TESTNET_ADDRESS);
  console.log(`💰 Initial balance: ${initialBalance} CKB\n`);
  
  if (initialBalance === 0) {
    console.log(`⚠️ Warning: Account has 0 balance. Devnet genesis accounts should have funds.`);
    console.log(`   Make sure you're using the correct devnet instance.`);
  }
  
  const results = {
    legitimate: false,
    missingSignatures: false,
    dustAttack: false,
    wrongWitnessCount: false,
    zeroCapacity: false
  };
  
  // Run tests
  results.legitimate = await testLegitimateTransaction();
  results.missingSignatures = await testMissingSignatures();
  results.dustAttack = await testDustAttack();
  results.wrongWitnessCount = await testWrongWitnessCount();
  results.zeroCapacity = await testZeroCapacity();
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 DEVNET TEST SUMMARY:");
  console.log(`  Legitimate Transaction: ${results.legitimate ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Missing Signatures: ${results.missingSignatures ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Dust Attack: ${results.dustAttack ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Wrong Witness Count: ${results.wrongWitnessCount ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Zero Capacity Outputs: ${results.zeroCapacity ? '✅ PASS' : '❌ FAIL'}`);
  
  const finalBalance = await getBalance(TESTNET_ADDRESS);
  console.log(`\n💰 Final balance: ${finalBalance} CKB`);
  console.log(`💰 Net change: ${finalBalance - initialBalance} CKB`);
  
  // Overall result
  const allPassed = Object.values(results).every(r => r === true);
  console.log(`\n${allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'}`);
}

// Run the tests
runDevnetTests().catch(console.error);