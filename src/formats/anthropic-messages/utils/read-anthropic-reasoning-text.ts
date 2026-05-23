import { isJsonObject } from "../../../core/json";

export function readAnthropicReasoningText(contentBlocks: readonly unknown[]): string {
  return contentBlocks
    .flatMap((contentBlock) => {
      if (!isJsonObject(contentBlock)) {
        return [];
      }

      if (contentBlock.type === "thinking" && typeof contentBlock.thinking === "string") {
        return [contentBlock.thinking];
      }

      if (contentBlock.type === "redacted_thinking") {
        return ["{{redacted_thinking}}"];
      }

      return [];
    })
    .join("\n");
}
