import type { LlmFormat } from "./format";
import type { LlmRequest } from "./message";

export interface LlmProviderRequestInput {
  format: LlmFormat<unknown, unknown>;
  request: LlmRequest;
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
