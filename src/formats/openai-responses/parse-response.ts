import { LlmIoError } from "../../core/errors";
import type { LlmOutput } from "../../core/output";
import { createAssistantMessage } from "../../core/output";
import { openAIResponsesRawSchema, type OpenAIResponsesRaw } from "./raw-schema";
import { createOpenAIResponsesExtras } from "./utils/create-openai-responses-extras";
import { createOpenAIResponsesToolCalls } from "./utils/create-openai-responses-tool-calls";
import { createOpenAIResponsesUsage } from "./utils/create-openai-responses-usage";
import { readOpenAIResponsesOutputText } from "./utils/read-openai-responses-output-text";
import { readOpenAIResponsesReasoningText } from "./utils/read-openai-responses-reasoning-text";

export interface OpenAIResponsesExtras {
  provider: "openai-responses";
  responseId?: string;
}

export function parseOpenAIResponsesResponse(
  responseJson: unknown,
): LlmOutput<OpenAIResponsesRaw, OpenAIResponsesExtras> {
  const raw = openAIResponsesRawSchema.parse(responseJson);
  const outputItems = raw.output ?? [];
  const text = readOpenAIResponsesOutputText(outputItems);
  const toolCalls = createOpenAIResponsesToolCalls(outputItems);

  if (text.length === 0 && toolCalls.length === 0) {
    throw new LlmIoError(
      "OpenAI responses output must contain output_text content or function_call items.",
    );
  }

  const reasoningText = readOpenAIResponsesReasoningText(outputItems);
  const reasoning = reasoningText.length === 0 ? undefined : { text: reasoningText };
  const usage = createOpenAIResponsesUsage(raw.usage);

  return {
    message: createAssistantMessage(text, toolCalls),
    ...(reasoning === undefined ? {} : { reasoning }),
    ...(toolCalls.length === 0 ? {} : { toolCalls, finishReason: "tool-call" }),
    ...(usage === undefined ? {} : { usage }),
    raw,
    extras: createOpenAIResponsesExtras(raw),
  };
}
