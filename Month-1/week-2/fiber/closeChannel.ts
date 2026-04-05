
import { fiberClient } from "./client.js";

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) return undefined;
  return process.argv[index + 1];
}

export async function closeChannel(channelId: string) {
  // Replace "close_channel" if your RPC docs use another method name.
  return fiberClient.call("close_channel", [
    {
      channel_id: channelId,
    },
  ]);
}

async function main() {
  const channelId = getArg("--channelId");

  if (!channelId) {
    throw new Error("Missing --channelId");
  }

  const result = await closeChannel(channelId);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Failed to close channel:", error);
  process.exit(1);
});