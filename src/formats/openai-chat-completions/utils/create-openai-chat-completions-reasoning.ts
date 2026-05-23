export function createOpenAIChatCompletionsReasoning(
  text: string | undefined,
): { text: string } | undefined {
  if (text === undefined || text.length === 0) {
    return undefined;
  }

  return { text };
}
