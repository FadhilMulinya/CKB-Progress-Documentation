
import { fiberClient } from "./client.js";
import type { FiberNodeInfo } from "./types.js";

export async function getNodeInfo(): Promise<FiberNodeInfo> {
  // Replace "node_info" with the exact method name from your Fiber RPC docs if needed.
  return fiberClient.call<FiberNodeInfo>("node_info", []);
}

async function main() {
  const info = await getNodeInfo();
  console.log(JSON.stringify(info, null, 2));
}

main().catch((error) => {
  console.error("Failed to fetch node info:", error);
  process.exit(1);
});