import { isJsonObject } from "../../../core/json";

export function readOpenAIResponsesOutputTextFromItem(outputItem: unknown): string[] {
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
