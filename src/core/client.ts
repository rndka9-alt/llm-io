import type { LlmRequest } from "./message";
import type { LlmStreamEvent } from "./stream";

export interface LlmClient<TOutput> {
  /** 완성된 응답을 반환합니다. */
  generate(request: LlmRequest): Promise<TOutput>;

  /** 정규화된 event stream을 반환합니다. */
  stream(request: LlmRequest): ReadableStream<LlmStreamEvent>;

  /** text delta만 반환합니다. raw stream이 아닙니다. */
  streamText(request: LlmRequest): ReadableStream<string>;
}
