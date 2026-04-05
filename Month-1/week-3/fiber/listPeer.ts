import { fiberClient } from "../../week-2/fiber/client.js";

export const listPeers = async (): Promise<unknown> => {
  return fiberClient.call("list_peers", []);
};

async function main(): Promise<void> {
  const result = await listPeers();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Failed to list peers:", error);
  process.exit(1);
});