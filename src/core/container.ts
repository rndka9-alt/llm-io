import type { LlmRequest } from "./message.js";

export interface LlmContainer<TOutput> {
  generate(request: LlmRequest): Promise<TOutput>;
}
