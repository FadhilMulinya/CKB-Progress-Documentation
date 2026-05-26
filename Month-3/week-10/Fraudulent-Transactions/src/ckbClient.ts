// ckbClient.ts
import { ccc } from "@ckb-ccc/shell";

//Randomn CLI Testnet address
export const TESTNET_ADDRESS = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvwg2cen8extgq8s5puft8vf40px3f599cytcyd8";
export const PRIVATE_KEY="0x6109170b275a09ad54877b82f7d9930f88cab5717d484fb4741ae9d1dd078cd6"
export const PUBLIC_KEY="0x02025fa7b61b2365aa459807b84df065f1949d58c0ae590ff22dd2595157bffefa"
export const LOCK_ARGS="0x8e42b1999f265a0078503c4acec4d5e134534297"


// Connect to testnet
export const client = new ccc.ClientPublicTestnet();


export async function getBalance(address: string): Promise<bigint> {
  try {
    console.log(`  Getting balance for testnet...`);
    const addr = await ccc.Address.fromString(address, client);
    const balance = await client.getBalance([addr.script]);
    return balance;
  } catch (error) {
    console.error("Error getting balance:", error);
    return 0n;
  }
}

export default {
  client,
  TESTNET_ADDRESS,
  getBalance,
  PRIVATE_KEY,
  PUBLIC_KEY,
  LOCK_ARGS,
};
