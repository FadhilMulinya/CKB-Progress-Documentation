import { fiberClient } from "../../week-2/fiber/client.js";

function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  ) as Partial<T>;
}

export interface ShutdownChannelParams {
  channelId: string;
  closeScript?: unknown;
  feeRate?: number;
  force?: boolean;
}

export async function shutdownChannel(
  params: ShutdownChannelParams
): Promise<unknown> {
  const force = params.force ?? false;

  if (!force) {
    if (params.closeScript === undefined) {
      throw new Error("closeScript is required when force is false");
    }
    if (params.feeRate === undefined) {
      throw new Error("feeRate is required when force is false");
    }
  }

  return fiberClient.call("shutdown_channel", [
    clean({
      channel_id: params.channelId,
      close_script: params.closeScript,
      fee_rate: params.feeRate,
      force,
    }),
  ]);
}

function parseCloseScript(value?: string): unknown {
  if (!value) return undefined;

  try {
    return JSON.parse(value);
  } catch {
    throw new Error("Invalid closeScript JSON");
  }
}

function parseFeeRate(value?: string): number | undefined {
  if (!value) return undefined;

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error("feeRate must be a valid number");
  }

  return parsed;
}

function parseForce(value?: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;

  throw new Error('force must be "true" or "false"');
}

async function main(): Promise<void> {
  const channelId = process.argv[2];
  const closeScriptRaw = process.argv[3];
  const feeRateRaw = process.argv[4];
  const forceRaw = process.argv[5];

  if (!channelId) throw new Error("Missing channel ID");

  const result = await shutdownChannel({
    channelId,
    closeScript: parseCloseScript(closeScriptRaw),
    feeRate: parseFeeRate(feeRateRaw),
    force: parseForce(forceRaw),
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Failed to shutdown channel:", error);
  process.exit(1);
});