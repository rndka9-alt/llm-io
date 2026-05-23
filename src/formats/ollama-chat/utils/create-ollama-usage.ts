import type { LlmUsage } from "../../../core/output";
import type { OllamaChatRaw } from "../raw-schema";

export function createOllamaUsage(raw: OllamaChatRaw): LlmUsage | undefined {
  if (raw.prompt_eval_count === undefined && raw.eval_count === undefined) {
    return undefined;
  }

  const totalTokens =
    raw.prompt_eval_count === undefined || raw.eval_count === undefined
      ? undefined
      : raw.prompt_eval_count + raw.eval_count;

  return {
    ...(raw.prompt_eval_count === undefined ? {} : { inputTokens: raw.prompt_eval_count }),
    ...(raw.eval_count === undefined ? {} : { outputTokens: raw.eval_count }),
    ...(totalTokens === undefined ? {} : { totalTokens }),
  };
}
