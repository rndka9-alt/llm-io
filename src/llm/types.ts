import type { LlmFormat } from "../core/format";
import type { BuiltInLlmFormatId } from "../core/format-id";
import type { LlmProvider } from "../core/provider";
import type { FetchLike } from "../transport/fetch-like";

export type LlmOptions<TRaw, TExtras = undefined, TId extends string = BuiltInLlmFormatId> =
  | LlmProviderOptions<TRaw, TExtras, TId>
  | LlmLegacyHttpOptions<TRaw, TExtras, TId>;

export interface LlmProviderOptions<
  TRaw,
  TExtras = undefined,
  TId extends string = BuiltInLlmFormatId,
> {
  /** 테스트나 런타임 교체용 fetch 구현입니다. */
  fetch?: FetchLike;
  /** request/response shape를 담당하는 format입니다. */
  format: LlmFormat<TRaw, TExtras, TId>;
  /** endpoint와 인증을 담당하는 provider입니다. */
  provider: LlmProvider;
}

export interface LlmLegacyHttpOptions<
  TRaw,
  TExtras = undefined,
  TId extends string = BuiltInLlmFormatId,
> {
  /** Bearer 인증에 사용할 API key입니다. */
  apiKey?: string;
  /** 요청을 보낼 기본 URL입니다. */
  baseUrl: string;
  /** 테스트나 런타임 교체용 fetch 구현입니다. */
  fetch?: FetchLike;
  /** request/response shape를 담당하는 format입니다. */
  format: LlmFormat<TRaw, TExtras, TId>;
  /** 요청에 추가할 header입니다. */
  headers?: Record<string, string>;
}

export type HttpLlmContainerOptions<
  TRaw,
  TExtras = undefined,
  TId extends string = BuiltInLlmFormatId,
> = LlmOptions<TRaw, TExtras, TId>;
