import type { JsonObject } from "../types/json";
import type { LlmRequest } from "./message";
import type { LlmOutput } from "./output";
import type { LlmStreamEvent } from "./stream";

export interface LlmFormat<TRaw, TExtras = undefined> {
  readonly id: string;
  readonly model?: string;

  /** 일반 요청 body를 만듭니다. */
  createRequestBody(request: LlmRequest): JsonObject;

  /** streaming 요청 body를 만듭니다. */
  createStreamRequestBody?(request: LlmRequest): JsonObject;

  /** 완성 응답을 공통 output으로 파싱합니다. */
  parseResponse(responseJson: unknown): LlmOutput<TRaw, TExtras>;

  /** streaming 응답을 공통 event로 파싱합니다. */
  parseStream?(events: AsyncIterable<unknown>): AsyncIterable<LlmStreamEvent>;
}

export type InferFormatRaw<TFormat> = TFormat extends LlmFormat<infer TRaw, unknown> ? TRaw : never;

export type InferFormatExtras<TFormat> =
  TFormat extends LlmFormat<unknown, infer TExtras> ? TExtras : never;

export type InferFormatOutput<TFormat> =
  TFormat extends LlmFormat<infer TRaw, infer TExtras> ? LlmOutput<TRaw, TExtras> : never;
