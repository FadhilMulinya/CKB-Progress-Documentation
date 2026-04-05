import {fiberClient} from  "../../week-2/fiber/client.js";

function getArg(flag: string) : string | undefined {
    const index = process.argv.indexOf(flag);
    if (index === -1 || index + 1>= process.argv.length) return undefined;
    return process.argv[index + 1];
}

export interface AcceptChannelParams {
  temporaryChannelId: string;
  fundingAmount: string;

  // optional
  shutdownScript?: unknown; 
  maxTlcValueInFlight?: string; 
  maxTlcNumberInFlight?: number;
  tlcMinValue?: string; 
  tlcFeeProportionalMillionths?: string; 
  tlcExpiryDelta?: number;
}

export async function acceptChannel(params: AcceptChannelParams) : Promise<unknown> {
  return fiberClient.call("accept_channel", [
    {
      temporary_channel_id: params.temporaryChannelId,
      funding_amount: params.fundingAmount,

      shutdown_script: params.shutdownScript,
      max_tlc_value_in_flight: params.maxTlcValueInFlight,
      max_tlc_number_in_flight: params.maxTlcNumberInFlight,
      tlc_min_value: params.tlcMinValue,
      tlc_fee_proportional_millionths: params.tlcFeeProportionalMillionths,
      tlc_expiry_delta: params.tlcExpiryDelta,
    },
  ]);
}

export async function main(): Promise<void> {
  const temporaryChannelId = getArg("--temporaryChannelId");
  const fundingAmount = getArg("--fundingAmount");
  const shutdownScriptRaw = getArg("--shutdownScript");
  const maxTlcValueInFlight = getArg("--maxTlcValueInFlight");
  const maxTlcNumberInFlight = getArg("--maxTlcNumberInFlight");
  const tlcMinValue = getArg("--tlcMinValue");
  const tlcFeeProportionalMillionths = getArg("--tlcFeeProportionalMillionths");
  const tlcExpiryDelta = getArg("--tlcExpiryDelta");

  if (!temporaryChannelId) throw new Error("Missing --temporaryChannelId");
  if (!fundingAmount) throw new Error("Missing --fundingAmount");

  const result = await acceptChannel({
    temporaryChannelId,
    fundingAmount,
    shutdownScript: shutdownScriptRaw ? JSON.parse(shutdownScriptRaw) : undefined,
    maxTlcValueInFlight,
    maxTlcNumberInFlight: maxTlcNumberInFlight ? Number(maxTlcNumberInFlight) : undefined,
    tlcMinValue,
    tlcFeeProportionalMillionths,
    tlcExpiryDelta: tlcExpiryDelta ? Number(tlcExpiryDelta) : undefined,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Failed to accept channel:", error);
  process.exit(1);
});