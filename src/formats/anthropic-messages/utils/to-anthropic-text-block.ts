import type { AnthropicTextBlock } from "../types";

export function toAnthropicTextBlock(text: string): AnthropicTextBlock {
  return {
    type: "text",
    text,
  };
}
