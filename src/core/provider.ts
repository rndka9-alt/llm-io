export interface LlmProviderRequestInput {
  body: Record<string, unknown>;
  requestPath?: string;
  signal?: AbortSignal;
}

export interface LlmProviderRequest {
  body: unknown;
  headers: Record<string, string>;
  method: string;
  signal?: AbortSignal;
  url: string;
}

export interface LlmProvider {
  readonly id: string;
  createRequest(input: LlmProviderRequestInput): LlmProviderRequest | Promise<LlmProviderRequest>;
}
