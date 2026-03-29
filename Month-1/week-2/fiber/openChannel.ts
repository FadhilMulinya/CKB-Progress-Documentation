
import { fiberClient } from "./client.js";

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

export interface OpenChannelParams {
  peerId: string;
  fundingAmount: string;
  public: boolean;
}

export async function openChannel(params: OpenChannelParams) {
  const { peerId, fundingAmount, public: isPublic } = params;

  // Replace "open_channel" and param shape with the exact Fiber RPC docs if needed.
  return fiberClient.call("open_channel", [
    {
      peer_id: peerId,
      funding_amount: fundingAmount,
      public: isPublic,
    },
  ]);
}

async function main() {
  const peerId = getArg("--peerId");
  const fundingAmount = getArg("--amount");
  const isPublic = getArg("--public") === "true";

  if (!peerId) throw new Error("Missing --peerId");
  if (!fundingAmount) throw new Error("Missing --amount");

  const result = await openChannel({
    peerId,
    fundingAmount,
    public: isPublic,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Failed to open channel:", error);
  process.exit(1);
});