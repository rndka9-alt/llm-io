import type { LlmFormat } from "./format";
import type { JsonValue } from "../types/json";
import type { LlmRequest } from "./message";

export interface LlmProviderRequestInput {
  /** provider request shape를 만들 format입니다. */
  format: LlmFormat<unknown, unknown, string>;
  /** 호출자가 전달한 공통 요청입니다. */
  request: LlmRequest;
}

export interface LlmProviderRequest {
  /** provider에 전송할 body입니다. */
  body: JsonValue;
  /** provider에 전송할 header입니다. */
  headers: Record<string, string>;
  /** HTTP method입니다. */
  method: string;
  /** 요청 취소용 signal입니다. */
  signal?: AbortSignal;
  /** 최종 request URL입니다. */
  url: string;
}

export interface LlmProvider {
  readonly id: string;
  /** 공통 요청을 provider별 HTTP 요청으로 변환합니다. */
  createRequest(input: LlmProviderRequestInput): LlmProviderRequest | Promise<LlmProviderRequest>;
  /** 공통 요청을 provider별 streaming HTTP 요청으로 변환합니다. */
  createStreamRequest?(
    input: LlmProviderRequestInput,
  ): LlmProviderRequest | Promise<LlmProviderRequest>;
  /** provider streaming body를 JSON event stream으로 읽습니다. */
  readStream?(
    body: ReadableStream<Uint8Array>,
    format: LlmFormat<unknown, unknown, string>,
  ): AsyncIterable<unknown>;
}
