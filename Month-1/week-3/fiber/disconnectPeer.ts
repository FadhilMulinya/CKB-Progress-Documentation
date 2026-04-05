import { fiberClient } from "../../week-2/fiber/client.js";

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) return undefined;
  return process.argv[index + 1];
}

export async function disconnectPeer(peerId: string): Promise<unknown> {
  return fiberClient.call("disconnect_peer", [
    {
      peer_id: peerId,
    },
  ]);
}

export async function main() {
  const peerId = getArg("--peerId");

  if (!peerId) throw new Error("Missing --peerId");

  const result = await disconnectPeer(peerId);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Failed to disconnect peer:", error);
  process.exit(1);
});