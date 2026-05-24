import {
  openAIResponsesMessageOutputItemSchema,
  openAIResponsesOutputTextContentPartSchema,
} from "../raw-schema";

export function readOpenAIResponsesOutputTextFromItem(outputItem: unknown): string[] {
  const outputItemResult = openAIResponsesMessageOutputItemSchema.safeParse(outputItem);

  if (!outputItemResult.success) {
    return [];
  }

  return outputItemResult.data.content.flatMap((contentPart) => {
    const contentPartResult = openAIResponsesOutputTextContentPartSchema.safeParse(contentPart);

    if (!contentPartResult.success) {
      return [];
    }

    return [contentPartResult.data.text];
  });
}
