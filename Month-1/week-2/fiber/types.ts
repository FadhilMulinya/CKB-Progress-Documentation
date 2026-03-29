
export type HexString = `0x${string}`;

export interface FiberChannel {
  channel_id?: string;
  peer_id?: string;
  state?: string;
  balance?: string;
  local_balance?: string;
  remote_balance?: string;
  funding_tx_hash?: string;
}

export interface FiberNodeInfo {
  node_name?: string;
  peer_id?: string;
  version?: string;
  addresses?: string[];
}