import type { JsonObject } from "./json";
import type { LlmRequest } from "./message";
import type { LlmOutput } from "./output";

export interface LlmFormat<TRaw, TExtras = undefined> {
  readonly id: string;
  readonly model?: string;
  createRequestBody(request: LlmRequest): JsonObject;
  parseResponse(responseJson: unknown): LlmOutput<TRaw, TExtras>;
}

export type InferFormatRaw<TFormat> = TFormat extends LlmFormat<infer TRaw, unknown> ? TRaw : never;

export type InferFormatExtras<TFormat> =
  TFormat extends LlmFormat<unknown, infer TExtras> ? TExtras : never;

export type InferFormatOutput<TFormat> =
  TFormat extends LlmFormat<infer TRaw, infer TExtras> ? LlmOutput<TRaw, TExtras> : never;
