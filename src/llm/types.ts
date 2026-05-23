import type { LlmFormat } from "../core/format";
import type { LlmProvider } from "../core/provider";
import type { FetchLike } from "../transport/fetch-like";

export type LlmOptions<TRaw, TExtras = undefined> =
  | LlmProviderOptions<TRaw, TExtras>
  | LlmLegacyHttpOptions<TRaw, TExtras>;

export interface LlmProviderOptions<TRaw, TExtras = undefined> {
  fetch?: FetchLike;
  format: LlmFormat<TRaw, TExtras>;
  provider: LlmProvider;
}

export interface LlmLegacyHttpOptions<TRaw, TExtras = undefined> {
  apiKey?: string;
  baseUrl: string;
  fetch?: FetchLike;
  format: LlmFormat<TRaw, TExtras>;
  headers?: Record<string, string>;
}

export type HttpLlmContainerOptions<TRaw, TExtras = undefined> = LlmOptions<TRaw, TExtras>;
