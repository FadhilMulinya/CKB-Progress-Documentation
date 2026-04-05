import { fiberClient } from "../../week-2/fiber/client.js";

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) return undefined;
  return process.argv[index + 1];
}

export async function settleInvoice(
  paymentHash: string,
  paymentPreimage: string,
) {
  return fiberClient.call("settle_invoice", [
    {
      payment_hash: paymentHash,
      payment_preimage: paymentPreimage,
    },
  ]);
}

async function main() {
  const paymentHash = getArg("--paymentHash");
  const paymentPreimage = getArg("--paymentPreimage");

  if (!paymentHash) throw new Error("Missing --paymentHash");
  if (!paymentPreimage) throw new Error("Missing --paymentPreimage");

  const result = await settleInvoice(paymentHash, paymentPreimage);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Failed to settle invoice:", error);
  process.exit(1);
});
