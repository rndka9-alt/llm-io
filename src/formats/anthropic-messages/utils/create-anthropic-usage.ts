import type { LlmUsage } from "../../../core/output";
import { omitUndefined, undefinedIfEmptyObject } from "../../../utils/object";
import type { AnthropicMessagesRaw } from "../raw-schema";

export function createAnthropicUsage(usage: AnthropicMessagesRaw["usage"]): LlmUsage | undefined {
  if (usage === undefined) {
    return undefined;
  }

  const inputTokens = createInputTokens(usage);
  const totalTokens = sumTokens(inputTokens, usage.output_tokens);
  const details = undefinedIfEmptyObject(omitUndefined({ serverToolUse: usage.server_tool_use }));

  return omitUndefined({
    cacheCreationInputTokens: usage.cache_creation_input_tokens,
    cacheReadInputTokens: usage.cache_read_input_tokens,
    inputTokens,
    outputTokens: usage.output_tokens,
    details,
    totalTokens,
  });
}

function createInputTokens(usage: AnthropicMessagesRaw["usage"]): number | undefined {
  if (usage === undefined || usage.input_tokens === undefined) {
    return undefined;
  }

  return (
    usage.input_tokens +
    (usage.cache_creation_input_tokens ?? 0) +
    (usage.cache_read_input_tokens ?? 0)
  );
}

function sumTokens(left: number | undefined, right: number | undefined): number | undefined {
  if (left === undefined || right === undefined) {
    return undefined;
  }

  return left + right;
}
