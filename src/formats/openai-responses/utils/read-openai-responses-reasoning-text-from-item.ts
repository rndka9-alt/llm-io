import { openAIResponsesReasoningOutputItemSchema } from "../raw-schema";

export function readOpenAIResponsesReasoningTextFromItem(outputItem: unknown): string[] {
  const outputItemResult = openAIResponsesReasoningOutputItemSchema.safeParse(outputItem);

  if (!outputItemResult.success || outputItemResult.data.summary === undefined) {
    return [];
  }

  return outputItemResult.data.summary.map((summaryPart) => summaryPart.text);
}
