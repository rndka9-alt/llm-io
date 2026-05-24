import type { LlmUsage } from "../../../core/output";
import type { AnthropicMessagesRaw } from "../raw-schema";

export function createAnthropicUsage(usage: AnthropicMessagesRaw["usage"]): LlmUsage | undefined {
  if (usage === undefined) {
    return undefined;
  }

  const inputTokens =
    usage.input_tokens === undefined
      ? undefined
      : usage.input_tokens +
        (usage.cache_creation_input_tokens ?? 0) +
        (usage.cache_read_input_tokens ?? 0);
  const totalTokens =
    inputTokens === undefined || usage.output_tokens === undefined
      ? undefined
      : inputTokens + usage.output_tokens;
  const details =
    usage.server_tool_use === undefined ? undefined : { serverToolUse: usage.server_tool_use };

  return {
    ...(usage.cache_creation_input_tokens === undefined
      ? {}
      : { cacheCreationInputTokens: usage.cache_creation_input_tokens }),
    ...(usage.cache_read_input_tokens === undefined
      ? {}
      : { cacheReadInputTokens: usage.cache_read_input_tokens }),
    ...(inputTokens === undefined ? {} : { inputTokens }),
    ...(usage.output_tokens === undefined ? {} : { outputTokens: usage.output_tokens }),
    ...(details === undefined ? {} : { details }),
    ...(totalTokens === undefined ? {} : { totalTokens }),
  };
}
