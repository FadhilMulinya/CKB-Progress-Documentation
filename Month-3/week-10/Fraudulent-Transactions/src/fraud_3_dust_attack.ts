import { ccc } from "@ckb-ccc/shell";

console.log("🔴 FRAUD 3: Dust Attack - Creating 1000+ tiny outputs\n");

const testAddress = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqflz4emgssc6nqj4yv3nfv2sca7g9dzhscgmg28x";
const client = new ccc.ClientPublicTestnet();
const { script: lock } = await ccc.Address.fromString(testAddress, client);

const dustThreshold = 61; // CKB minimum
const dustOutputs = [];

// Create 100 outputs of 1 CKB each (use bigint for capacity)
for (let i = 0; i < 100; i++) {
  dustOutputs.push({
    capacity: 100000000n, // 1 CKB in shannons
    lock: lock,
  });
}

const tx = ccc.Transaction.from({
  outputs: dustOutputs,
});

console.log(`Total outputs: ${tx.outputs.length}`);
console.log(`Minimum allowed per output: ${dustThreshold} CKB\n`);

// Detection
function capacityToCKB(capacity: any): number {
  if (typeof capacity === 'bigint') {
    return Number(capacity) / 100000000;
  }
  if (typeof capacity === 'string' && capacity.startsWith('0x')) {
    return parseInt(capacity, 16) / 100000000;
  }
  return 0;
}

const dustDetected: Array<{ index: number; capacity: number }> = [];

for (let i = 0; i < tx.outputs.length; i++) {
  const capacityNum = capacityToCKB(tx.outputs[i].capacity);
  if (capacityNum < dustThreshold) {
    dustDetected.push({ index: i, capacity: capacityNum });
  }
}

console.log(`🚨 DUST ATTACK DETECTED: ${dustDetected.length} outputs below ${dustThreshold} CKB`);

if (dustDetected.length > 0) {
  console.log(`Example: Output[${dustDetected[0].index}] has ${dustDetected[0].capacity} CKB`);
}

if (tx.outputs.length > 100) {
  console.log(`🚨 SPAM DETECTED: ${tx.outputs.length} outputs in single transaction`);
}

// Calculate total dust
const totalDustCapacity = dustDetected.length * 1;
console.log(`\nTotal capacity in dust outputs: ${totalDustCapacity} CKB`);
console.log(`This transaction would waste capacity on many small outputs`);