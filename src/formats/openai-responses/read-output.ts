export function readOpenAIResponsesOutputText(outputItems: readonly unknown[]): string {
  return outputItems.flatMap(readOutputTextFromItem).join("");
}

export function readOpenAIResponsesReasoningText(outputItems: readonly unknown[]): string {
  return outputItems.flatMap(readReasoningTextFromItem).join("\n");
}

function readOutputTextFromItem(outputItem: unknown): string[] {
  if (
    !isRecord(outputItem) ||
    outputItem.type !== "message" ||
    !Array.isArray(outputItem.content)
  ) {
    return [];
  }

  return outputItem.content.flatMap((contentPart) => {
    if (
      !isRecord(contentPart) ||
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
    !isRecord(outputItem) ||
    outputItem.type !== "reasoning" ||
    !Array.isArray(outputItem.summary)
  ) {
    return [];
  }

  return outputItem.summary.flatMap((summaryPart) => {
    if (!isRecord(summaryPart) || typeof summaryPart.text !== "string") {
      return [];
    }

    return [summaryPart.text];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
