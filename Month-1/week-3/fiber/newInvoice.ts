import { fiberClient } from "../../week-2/fiber/client.js";

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) return undefined;
  return process.argv[index + 1];
}

export async function newInvoice(
  amount: string,
  currency: string,
  description?: string,
) {
  return fiberClient.call("new_invoice", [
    {
      amount,
      currency,
      description,
    },
  ]);
}

async function main() {
  const amount = getArg("--amount");
  const currency = getArg("--currency");
  const description = getArg("--description");

  if (!amount) throw new Error("Missing --amount");
  if (!currency) throw new Error("Missing --currency");

  const result = await newInvoice(amount, currency, description);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Failed to create invoice:", error);
  process.exit(1);
});
