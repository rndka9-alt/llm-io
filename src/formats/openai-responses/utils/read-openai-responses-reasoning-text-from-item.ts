import { isJsonObject } from "../../../core/json";

export function readOpenAIResponsesReasoningTextFromItem(outputItem: unknown): string[] {
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
