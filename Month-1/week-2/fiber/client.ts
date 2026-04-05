export type JsonRpcSuccess<T> = {
  jsonrpc: "2.0";
  id: number;
  result: T;
};

export type JsonRpcError = {
  jsonrpc: "2.0";
  id: number;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
};

export type JsonRpcResponse<T> = JsonRpcSuccess<T> | JsonRpcError;

export class FiberRpcClient {
  constructor(
    private readonly rpcUrl: string = process.env.FIBER_RPC_URL || "http://127.0.0.1:8227",
  ) {}

  async call<T>(method: string, params: unknown[] = []): Promise<T> {
    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as JsonRpcResponse<T>;

    if ("error" in data) {
      throw new Error(`Fiber RPC error ${data.error.code}: ${data.error.message}`);
    }

    return data.result;
  }
}

export const fiberClient = new FiberRpcClient();