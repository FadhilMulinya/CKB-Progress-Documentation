import { fiberClient } from "../../week-2/fiber/client.js";

function getArg(flag: string) : string | undefined {
    const index = process.argv.indexOf(flag);
    if (index === -1 || index + 1 >= process.argv.length) return undefined;
    return process.argv[index + 1];
}

export async function abandonChannel(temporary_channel_id: string) : Promise<unknown> {
    return fiberClient.call("abandon_channel", [
        {
            temporary_channel_id
        }
    ]);
}

export async function main(): Promise<void> {
    const temporaryChannelId = getArg("--temporaryChannelId");

    if (!temporaryChannelId) throw new Error("Missing --temporaryChannelId");

    const result = await abandonChannel(temporaryChannelId);
    console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
    console.error("Failed to abandon channel:", error);
    process.exit(1);
});