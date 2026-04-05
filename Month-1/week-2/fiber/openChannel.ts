import { fiberClient } from "./client.js";

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) return undefined;
  return process.argv[index + 1];
}

export interface OpenChannelParams {
  peerId: string;
  fundingAmount: string; // expected Fiber amount format, e.g. hex string
  isPublic?: boolean;
}

export async function openChannel({
  peerId,
  fundingAmount,
  isPublic = false,
}: OpenChannelParams) {
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
    isPublic,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Failed to open channel:", error);
  process.exit(1);
});