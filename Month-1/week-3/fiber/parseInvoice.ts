import { fiberClient } from "../../week-2/fiber/client.js";

function getArg(flag: string) : string | undefined {
    const index = process.argv.indexOf(flag);
    if (index === -1 || index + 1 >= process.argv.length) return undefined;
    return process.argv[index + 1];
}

export async function parseInvoice(invoiceAdd: string) : Promise<unknown> {
    return fiberClient.call("parse_invoice", [
        {
            invoice: invoiceAdd
        }
    ]);
}

export async function main(): Promise<void> {
    const invoiceAdd = getArg("--invoiceAdd");
    
    if (!invoiceAdd) throw new Error("Missing --invoiceAdd");
    const result = await parseInvoice(invoiceAdd);
    console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
    console.error("Failed to parse invoice:", error);
    process.exit(1);
});