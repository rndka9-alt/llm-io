import { LlmIoError } from "../../../core/errors";
import type { LlmAssistantContentPart } from "../../../core/output";
import {
  anthropicMessagesContentBlockSchema,
  anthropicMessagesKnownContentBlockSchema,
} from "../raw-schema";

export function createAnthropicAssistantContent(
  contentBlocks: readonly unknown[],
): LlmAssistantContentPart[] {
  const content: LlmAssistantContentPart[] = [];

  for (const rawContentBlock of contentBlocks) {
    const knownContentBlockResult =
      anthropicMessagesKnownContentBlockSchema.safeParse(rawContentBlock);

    if (!knownContentBlockResult.success) {
      const contentBlockResult = anthropicMessagesContentBlockSchema.safeParse(rawContentBlock);

      if (!contentBlockResult.success) {
        throw new LlmIoError(
          "Anthropic assistant content block is invalid.",
          contentBlockResult.error,
        );
      }

      continue;
    }

    const contentBlock = knownContentBlockResult.data;

    if (contentBlock.type === "text") {
      content.push({ type: "text", text: contentBlock.text });
      continue;
    }

    if (contentBlock.type === "tool_use") {
      content.push({
        type: "tool-call",
        id: contentBlock.id,
        name: contentBlock.name,
        arguments: contentBlock.input,
      });
      continue;
    }

    if (contentBlock.type === "thinking") {
      content.push({
        type: "thinking",
        thinking: contentBlock.thinking,
        ...(contentBlock.signature === undefined ? {} : { signature: contentBlock.signature }),
      });
      continue;
    }

    if (contentBlock.type === "redacted_thinking") {
      content.push({
        type: "redacted-thinking",
        ...(contentBlock.data === undefined ? {} : { data: contentBlock.data }),
      });
    }
  }

  return content;
}
