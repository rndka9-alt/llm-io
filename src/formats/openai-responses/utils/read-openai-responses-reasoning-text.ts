import { readOpenAIResponsesReasoningTextFromItem } from "./read-openai-responses-reasoning-text-from-item";

export function readOpenAIResponsesReasoningText(outputItems: readonly unknown[]): string {
  return outputItems.flatMap(readOpenAIResponsesReasoningTextFromItem).join("\n");
}
