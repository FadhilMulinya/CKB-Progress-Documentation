import { fiberClient } from "../../week-2/fiber/client.js";

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) return undefined;
  return process.argv[index + 1];
}

export async function sendPayment(invoice: string) {
  return fiberClient.call("send_payment", [
    {
      invoice,
    },
  ]);
}

async function main() {
  const invoice = getArg("--invoice");

  if (!invoice) throw new Error("Missing --invoice");

  const result = await sendPayment(invoice);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Failed to send payment:", error);
  process.exit(1);
});