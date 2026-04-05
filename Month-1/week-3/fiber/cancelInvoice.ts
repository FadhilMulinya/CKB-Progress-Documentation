import { fiberClient } from "../../week-2/fiber/client.js";

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) return undefined;
  return process.argv[index + 1];
}

export async function cancelInvoice(paymentHash: string) {
  return fiberClient.call("cancel_invoice", [
    {
      payment_hash: paymentHash,
    },
  ]);
}

async function main() {
  const paymentHash = getArg("--paymentHash");

  if (!paymentHash) throw new Error("Missing --paymentHash");

  const result = await cancelInvoice(paymentHash);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Failed to cancel invoice:", error);
  process.exit(1);
});