import type { LlmUsage } from "../../../core/output";
import { omitUndefined } from "../../../utils/object";
import type { OllamaChatRaw } from "../raw-schema";

export function createOllamaUsage(raw: OllamaChatRaw): LlmUsage | undefined {
  if (raw.prompt_eval_count === undefined && raw.eval_count === undefined) {
    return undefined;
  }

  const totalTokens = sumTokens(raw.prompt_eval_count, raw.eval_count);

  return omitUndefined({
    inputTokens: raw.prompt_eval_count,
    outputTokens: raw.eval_count,
    totalTokens,
  });
}

function sumTokens(left: number | undefined, right: number | undefined): number | undefined {
  if (left === undefined || right === undefined) {
    return undefined;
  }

  return left + right;
}
