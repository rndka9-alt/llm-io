import { createAssistantMessage, createReasoning } from "../../core/output";
import type { LlmFinishReason } from "../../core/output";
import type { LlmToolCall } from "../../core/message";
import type { LlmStreamEvent } from "../../core/stream";
import { undefinedIfEmptyArray } from "../../utils/array";
import { omitUndefined } from "../../utils/object";
import { ollamaChatRawSchema } from "./raw-schema";
import { createOllamaToolCalls } from "./utils/create-ollama-tool-calls";
import { createOllamaUsage } from "./utils/create-ollama-usage";
import { normalizeOllamaFinishReason } from "./utils/normalize-ollama-finish-reason";

interface StreamState {
  finishReason?: LlmFinishReason;
  reasoningText: string;
  seenToolCallKeys: Set<string>;
  text: string;
  toolCalls: LlmToolCall[];
  usage?: ReturnType<typeof createOllamaUsage>;
}

export async function* parseOllamaChatStream(
  events: AsyncIterable<unknown>,
): AsyncIterable<LlmStreamEvent> {
  const state = createStreamState();

  for await (const event of events) {
    const raw = ollamaChatRawSchema.parse(event);
    const content = raw.message?.content;
    const thinking = raw.message?.thinking;
    const usage = createOllamaUsage(raw);
    const finishReason = normalizeOllamaFinishReason(raw.done_reason);

    if (content !== undefined && content.length > 0) {
      state.text += content;
      yield { type: "text-delta", text: content };
    }

    if (thinking !== undefined && thinking.length > 0) {
      state.reasoningText += thinking;
      yield { type: "reasoning-delta", text: thinking };
    }

    for (const toolCall of createOllamaToolCalls(raw.message)) {
      const toolCallKey = createToolCallKey(toolCall);

      if (state.seenToolCallKeys.has(toolCallKey)) {
        continue;
      }

      state.seenToolCallKeys.add(toolCallKey);
      state.toolCalls.push(toolCall);
      yield {
        type: "tool-call-delta",
        index: state.toolCalls.length - 1,
        name: toolCall.name,
      };
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
  return JSON.stringify([toolCall.name, toolCall.arguments]);
}
