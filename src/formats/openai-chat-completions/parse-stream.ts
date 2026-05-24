import { LlmIoError } from "../../core/errors";
import type { LlmToolCall } from "../../core/message";
import { createAssistantMessage, createReasoning } from "../../core/output";
import type { LlmFinishReason } from "../../core/output";
import type { LlmStreamEvent } from "../../core/stream";
import type { JsonObject } from "../../types/json";
import { isJsonObject } from "../../utils/json";
import { undefinedIfEmptyArray } from "../../utils/array";
import { omitUndefined } from "../../utils/object";
import {
  openAIChatCompletionsStreamRawSchema,
  type OpenAIChatCompletionsStreamRaw,
} from "./raw-schema";
import { createOpenAIChatCompletionsUsage } from "./utils/create-openai-chat-completions-usage";
import { normalizeOpenAIChatCompletionsFinishReason } from "./utils/normalize-openai-chat-completions-finish-reason";

interface ToolCallState {
  argumentsText: string;
  id?: string;
  name?: string;
}

export async function* parseOpenAIChatCompletionsStream(
  events: AsyncIterable<unknown>,
): AsyncIterable<LlmStreamEvent> {
  const state = createStreamState();

  for await (const event of events) {
    const raw = openAIChatCompletionsStreamRawSchema.parse(event);

    yield* parseOpenAIChatCompletionsStreamEvent(raw, state);
  }

  const toolCalls = createToolCalls(state.toolCallStates);

  for (const toolCall of toolCalls) {
    yield { type: "tool-call", toolCall };
  }

  yield omitUndefined({
    type: "done",
    message: createAssistantMessage(state.text, toolCalls),
    reasoning: createReasoning(state.reasoningText),
    toolCalls: undefinedIfEmptyArray(toolCalls),
    usage: state.usage,
    finishReason: state.finishReason,
  });
}

function* parseOpenAIChatCompletionsStreamEvent(
  raw: OpenAIChatCompletionsStreamRaw,
  state: StreamState,
): Iterable<LlmStreamEvent> {
  const usage = createOpenAIChatCompletionsUsage(raw.usage);

  if (usage !== undefined) {
    state.usage = usage;
    yield { type: "usage", usage };
  }

  for (const choice of raw.choices ?? []) {
    const content = choice.delta.content;

    if (content !== undefined && content !== null && content.length > 0) {
      state.text += content;
      yield { type: "text-delta", text: content };
    }

    const reasoning = choice.delta.reasoning_content ?? choice.delta.reasoning;

    if (reasoning !== undefined && reasoning.length > 0) {
      state.reasoningText += reasoning;
      yield { type: "reasoning-delta", text: reasoning };
    }

    for (const toolCallDelta of choice.delta.tool_calls ?? []) {
      const toolCallState = readToolCallState(state.toolCallStates, toolCallDelta.index);
      const functionDelta = toolCallDelta.function;

      if (toolCallDelta.id !== undefined) {
        toolCallState.id = toolCallDelta.id;
      }

      if (functionDelta?.name !== undefined) {
        toolCallState.name = functionDelta.name;
      }

      if (functionDelta?.arguments !== undefined) {
        toolCallState.argumentsText += functionDelta.arguments;
      }

      yield omitUndefined({
        type: "tool-call-delta",
        index: toolCallDelta.index,
        id: toolCallDelta.id,
        name: functionDelta?.name,
        argumentsTextDelta: functionDelta?.arguments,
      });
    }

    const finishReason = normalizeOpenAIChatCompletionsFinishReason(choice.finish_reason);

    if (finishReason !== undefined) {
      state.finishReason = finishReason;
      yield { type: "finish", finishReason };
    }
  }
}

interface StreamState {
  finishReason?: LlmFinishReason;
  reasoningText: string;
  text: string;
  toolCallStates: Map<number, ToolCallState>;
  usage?: ReturnType<typeof createOpenAIChatCompletionsUsage>;
}

function createStreamState(): StreamState {
  return {
    reasoningText: "",
    text: "",
    toolCallStates: new Map(),
  };
}

function readToolCallState(
  toolCallStates: Map<number, ToolCallState>,
  index: number,
): ToolCallState {
  const current = toolCallStates.get(index);

  if (current !== undefined) {
    return current;
  }

  const created = { argumentsText: "" };
  toolCallStates.set(index, created);

  return created;
}

function createToolCalls(toolCallStates: Map<number, ToolCallState>): LlmToolCall[] {
  const toolCalls: LlmToolCall[] = [];

  for (const [, toolCallState] of [...toolCallStates].sort(sortToolCallStateByIndex)) {
    if (toolCallState.name === undefined) {
      throw new LlmIoError("OpenAI stream tool call is missing a function name.");
    }

    toolCalls.push(
      omitUndefined({
        id: toolCallState.id,
        name: toolCallState.name,
        arguments: parseToolCallArguments(toolCallState.argumentsText),
      }),
    );
  }

  return toolCalls;
}

function sortToolCallStateByIndex(
  left: readonly [number, ToolCallState],
  right: readonly [number, ToolCallState],
): number {
  return left[0] - right[0];
}

function parseToolCallArguments(argumentsText: string): JsonObject {
  if (argumentsText.length === 0) {
    return {};
  }

  const parsed = JSON.parse(argumentsText);

  if (!isJsonObject(parsed)) {
    throw new LlmIoError("OpenAI stream tool call arguments must be a JSON object.");
  }

  return parsed;
}
