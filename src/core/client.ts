import type { LlmRequest } from "./message.js";

export interface LlmClient<TOutput> {
  generate(request: LlmRequest): Promise<TOutput>;
}
