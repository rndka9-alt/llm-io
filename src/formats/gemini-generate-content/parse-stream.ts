import { createAssistantMessage, createReasoning } from "../../core/output";
import type { LlmFinishReason } from "../../core/output";
import type { LlmStreamEvent } from "../../core/stream";
import type { LlmToolCall } from "../../core/message";
import { undefinedIfEmptyArray } from "../../utils/array";
import { omitUndefined } from "../../utils/object";
import { geminiGenerateContentRawSchema } from "./raw-schema";
import { createGeminiToolCalls } from "./utils/create-gemini-tool-calls";
import { createGeminiUsage } from "./utils/create-gemini-usage";
import { normalizeGeminiFinishReason } from "./utils/normalize-gemini-finish-reason";

interface StreamState {
  finishReason?: LlmFinishReason;
  reasoningText: string;
  seenToolCallKeys: Set<string>;
  text: string;
  toolCalls: LlmToolCall[];
  usage?: ReturnType<typeof createGeminiUsage>;
}

export async function* parseGeminiGenerateContentStream(
  events: AsyncIterable<unknown>,
): AsyncIterable<LlmStreamEvent> {
  const state = createStreamState();

  for await (const event of events) {
    const raw = geminiGenerateContentRawSchema.parse(event);
    const firstCandidate = raw.candidates?.[0];
    const parts = firstCandidate?.content?.parts ?? [];
    const usage = createGeminiUsage(raw.usageMetadata);
    const finishReason = normalizeGeminiFinishReason(firstCandidate?.finishReason);

    for (const part of parts) {
      if (part.text !== undefined && part.text.length > 0 && part.thought === true) {
        state.reasoningText += part.text;
        yield { type: "reasoning-delta", text: part.text };
      }

      if (part.text !== undefined && part.text.length > 0 && part.thought !== true) {
        state.text += part.text;
        yield { type: "text-delta", text: part.text };
      }
    }

    for (const toolCall of createGeminiToolCalls(parts)) {
      const toolCallKey = createToolCallKey(toolCall);

      if (state.seenToolCallKeys.has(toolCallKey)) {
        continue;
      }

      state.seenToolCallKeys.add(toolCallKey);
      state.toolCalls.push(toolCall);
      yield omitUndefined({
        type: "tool-call-delta",
        index: state.toolCalls.length - 1,
        id: toolCall.id,
        name: toolCall.name,
      });
    }

    if (usage !== undefined) {
      state.usage = usage;
      yield { type: "usage", usage };
    }

    if (finishReason !== undefined) {
      state.finishReason = finishReason;
      yield { type: "finish", finishReason };
    }
  }

  for (const toolCall of state.toolCalls) {
    yield { type: "tool-call", toolCall };
  }

  yield omitUndefined({
    type: "done",
    message: createAssistantMessage(state.text, state.toolCalls),
    reasoning: createReasoning(state.reasoningText),
    toolCalls: undefinedIfEmptyArray(state.toolCalls),
    usage: state.usage,
    finishReason: state.finishReason,
  });
}

function createStreamState(): StreamState {
  return {
    reasoningText: "",
    seenToolCallKeys: new Set(),
    text: "",
    toolCalls: [],
  };
}

function createToolCallKey(toolCall: LlmToolCall): string {
  return JSON.stringify([toolCall.id, toolCall.name, toolCall.arguments]);
}
