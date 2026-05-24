import { openAIResponsesReasoningOutputItemSchema } from "../raw-schema";

export function readOpenAIResponsesReasoningTextFromItem(outputItem: unknown): string[] {
  const outputItemResult = openAIResponsesReasoningOutputItemSchema.safeParse(outputItem);

  if (!outputItemResult.success) {
    return [];
  }

  const reasoningText: string[] = [];

  for (const contentPart of outputItemResult.data.content ?? []) {
    if (contentPart.type === "reasoning_text" && typeof contentPart.text === "string") {
      reasoningText.push(contentPart.text);
    }
  }
  const summaryText = outputItemResult.data.summary?.map((summaryPart) => summaryPart.text) ?? [];

  return [...reasoningText, ...summaryText];
}
