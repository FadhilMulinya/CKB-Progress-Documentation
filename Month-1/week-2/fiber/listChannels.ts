import { fiberClient } from "./client.js";
import type { FiberChannel } from "./types.js";

export async function listChannels(): Promise<FiberChannel[]> {
  // Replace "list_channels" if your RPC docs use a different method name.
  return fiberClient.call<FiberChannel[]>("list_channels", []);
}

async function main() {
  const channels = await listChannels();
  console.log(JSON.stringify(channels, null, 2));
}

main().catch((error) => {
  console.error("Failed to list channels:", error);
  process.exit(1);
});