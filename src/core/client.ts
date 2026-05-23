import type { LlmRequest } from "./message";

export interface LlmClient<TOutput> {
  generate(request: LlmRequest): Promise<TOutput>;
}
