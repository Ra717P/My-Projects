// types/midtrans-client.d.ts
declare module "midtrans-client" {
  export interface ClientConfig {
    isProduction?: boolean;
    serverKey?: string;
    clientKey?: string;
  }

  export class Snap {
    constructor(config: ClientConfig);
    createTransaction(
      parameters: Record<string, unknown>
    ): Promise<{ token: string; redirect_url: string }>;
  }

  export class CoreApi {
    constructor(config: ClientConfig);
    charge(parameters: Record<string, unknown>): Promise<unknown>;
    capture(parameters: Record<string, unknown>): Promise<unknown>;
    transaction: {
      status(orderId: string): Promise<unknown>;
      cancel(orderId: string): Promise<unknown>;
      approve(orderId: string): Promise<unknown>;
      deny(orderId: string): Promise<unknown>;
      expire(orderId: string): Promise<unknown>;
      refund(
        orderId: string,
        params: Record<string, unknown>
      ): Promise<unknown>;
    };
  }

  // Dukung `import midtransClient from "midtrans-client"`
  const _default: {
    Snap: typeof Snap;
    CoreApi: typeof CoreApi;
  };
  export default _default;
}
