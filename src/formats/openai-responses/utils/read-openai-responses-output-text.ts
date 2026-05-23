import { readOpenAIResponsesOutputTextFromItem } from "./read-openai-responses-output-text-from-item";

export function readOpenAIResponsesOutputText(outputItems: readonly unknown[]): string {
  return outputItems.flatMap(readOpenAIResponsesOutputTextFromItem).join("");
}
