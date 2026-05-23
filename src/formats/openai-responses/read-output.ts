import { isJsonObject } from "../../core/json";

export function readOpenAIResponsesOutputText(outputItems: readonly unknown[]): string {
  return outputItems.flatMap(readOutputTextFromItem).join("");
}

export function readOpenAIResponsesReasoningText(outputItems: readonly unknown[]): string {
  return outputItems.flatMap(readReasoningTextFromItem).join("\n");
}

function readOutputTextFromItem(outputItem: unknown): string[] {
  if (
    !isJsonObject(outputItem) ||
    outputItem.type !== "message" ||
    !Array.isArray(outputItem.content)
  ) {
    return [];
  }

  return outputItem.content.flatMap((contentPart) => {
    if (
      !isJsonObject(contentPart) ||
      contentPart.type !== "output_text" ||
      typeof contentPart.text !== "string"
    ) {
      return [];
    }

    return [contentPart.text];
  });
}

function readReasoningTextFromItem(outputItem: unknown): string[] {
  if (
    !isJsonObject(outputItem) ||
    outputItem.type !== "reasoning" ||
    !Array.isArray(outputItem.summary)
  ) {
    return [];
  }

  return outputItem.summary.flatMap((summaryPart) => {
    if (!isJsonObject(summaryPart) || typeof summaryPart.text !== "string") {
      return [];
    }

    return [summaryPart.text];
  });
}
