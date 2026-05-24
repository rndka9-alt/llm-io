import type { JsonObject } from "../types/json";
import type { BuiltInLlmFormatId } from "./format-id";
import type { LlmRequest } from "./message";
import type { LlmOutput } from "./output";
import type { LlmStreamEvent } from "./stream";

export interface LlmFormat<TRaw, TExtras = undefined, TId extends string = BuiltInLlmFormatId> {
  readonly id: TId;
  readonly model?: string;

  /** 일반 요청 body를 만듭니다. */
  createRequestBody(request: LlmRequest): JsonObject;

  /** 완성 응답을 공통 output으로 파싱합니다. */
  parseResponse(responseJson: unknown): LlmOutput<TRaw, TExtras>;

  /** streaming 응답을 공통 event로 파싱합니다. */
  parseStream?(events: AsyncIterable<unknown>): AsyncIterable<LlmStreamEvent>;
}

export type InferFormatRaw<TFormat> =
  TFormat extends LlmFormat<infer TRaw, unknown, string> ? TRaw : never;

export type InferFormatExtras<TFormat> =
  TFormat extends LlmFormat<unknown, infer TExtras, string> ? TExtras : never;

export type InferFormatOutput<TFormat> =
  TFormat extends LlmFormat<infer TRaw, infer TExtras, string> ? LlmOutput<TRaw, TExtras> : never;
