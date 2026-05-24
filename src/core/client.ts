import type { LlmRequest } from "./message";
import type { LlmStreamEvent } from "./stream";

export interface LlmClient<TOutput> {
  generate(request: LlmRequest): Promise<TOutput>;
  stream(request: LlmRequest): ReadableStream<LlmStreamEvent>;
  streamText(request: LlmRequest): ReadableStream<string>;
}
