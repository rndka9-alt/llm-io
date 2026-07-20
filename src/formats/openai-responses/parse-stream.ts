import { z } from "zod/v4";

import { LlmIoError } from "../../core/errors";
import type { LlmToolCall } from "../../core/message";
import { createAssistantMessage, createReasoning } from "../../core/output";
import type { LlmFinishReason } from "../../core/output";
import type { LlmStreamEvent } from "../../core/stream";
import type { JsonObject } from "../../types/json";
import { undefinedIfEmptyArray } from "../../utils/array";
import { isJsonObject } from "../../utils/json";
import { omitUndefined } from "../../utils/object";
import { openAIResponsesRawSchema } from "./raw-schema";
import { createOpenAIResponsesUsage } from "./utils/create-openai-responses-usage";

const openAIResponsesStreamEventSchema = z.object({ type: z.string() }).loose();

const openAIResponsesTextDeltaEventSchema = z
  .object({
    delta: z.string(),
    type: z.literal("response.output_text.delta"),
  })
  .loose();

const openAIResponsesReasoningDeltaEventSchema = z
  .object({
    delta: z.string(),
    type: z.enum(["response.reasoning_text.delta", "response.reasoning_summary_text.delta"]),
  })
  .loose();

const openAIResponsesFunctionCallItemSchema = z
  .object({
    arguments: z.string().optional(),
    call_id: z.string().optional(),
    name: z.string().optional(),
    type: z.literal("function_call"),
  })
  .loose();

const openAIResponsesOutputItemEventSchema = z
  .object({
    item: openAIResponsesFunctionCallItemSchema,
    output_index: z.number(),
    type: z.enum(["response.output_item.added", "response.output_item.done"]),
  })
  .loose();

const openAIResponsesFunctionCallArgumentsDeltaEventSchema = z
  .object({
    delta: z.string(),
    output_index: z.number(),
    type: z.literal("response.function_call_arguments.delta"),
  })
  .loose();

const openAIResponsesFunctionCallArgumentsDoneEventSchema = z
  .object({
    arguments: z.string(),
    output_index: z.number(),
    type: z.literal("response.function_call_arguments.done"),
  })
  .loose();

const openAIResponsesCompletedEventSchema = z
  .object({
    response: openAIResponsesRawSchema,
    type: z.literal("response.completed"),
  })
  .loose();

interface StreamState {
  finishReason?: LlmFinishReason;
  reasoningText: string;
  text: string;
  toolCallStates: Map<number, ToolCallState>;
  usage?: ReturnType<typeof createOpenAIResponsesUsage>;
}

interface ToolCallState {
  argumentsText: string;
  id?: string;
  name?: string;
}

export async function* parseOpenAIResponsesStream(
  events: AsyncIterable<unknown>,
): AsyncIterable<LlmStreamEvent> {
  const state = createStreamState();

  for await (const event of events) {
    const streamEvent = openAIResponsesStreamEventSchema.parse(event);

    yield* parseOpenAIResponsesStreamEvent(streamEvent, event, state);
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

function* parseOpenAIResponsesStreamEvent(
  streamEvent: z.infer<typeof openAIResponsesStreamEventSchema>,
  event: unknown,
  state: StreamState,
): Iterable<LlmStreamEvent> {
  if (streamEvent.type === "response.output_text.delta") {
    const raw = openAIResponsesTextDeltaEventSchema.parse(event);
    state.text += raw.delta;
    yield { type: "text-delta", text: raw.delta };
    return;
  }

  if (
    streamEvent.type === "response.reasoning_text.delta" ||
    streamEvent.type === "response.reasoning_summary_text.delta"
  ) {
    const raw = openAIResponsesReasoningDeltaEventSchema.parse(event);
    state.reasoningText += raw.delta;
    yield { type: "reasoning-delta", text: raw.delta };
    return;
  }

  if (
    streamEvent.type === "response.output_item.added" ||
    streamEvent.type === "response.output_item.done"
  ) {
    const raw = openAIResponsesOutputItemEventSchema.parse(event);
    const toolCallState = readToolCallState(state.toolCallStates, raw.output_index);

    if (raw.item.call_id !== undefined) {
      toolCallState.id = raw.item.call_id;
    }

    if (raw.item.name !== undefined) {
      toolCallState.name = raw.item.name;
    }

    if (raw.item.arguments !== undefined) {
      toolCallState.argumentsText = raw.item.arguments;
    }

    yield omitUndefined({
      type: "tool-call-delta",
      index: raw.output_index,
      id: raw.item.call_id,
      name: raw.item.name,
      argumentsTextDelta: raw.item.arguments,
    });
    return;
  }

  if (streamEvent.type === "response.function_call_arguments.delta") {
    const raw = openAIResponsesFunctionCallArgumentsDeltaEventSchema.parse(event);
    const toolCallState = readToolCallState(state.toolCallStates, raw.output_index);

    toolCallState.argumentsText += raw.delta;

    yield {
      type: "tool-call-delta",
      index: raw.output_index,
      argumentsTextDelta: raw.delta,
    };
    return;
  }

  if (streamEvent.type === "response.function_call_arguments.done") {
    const raw = openAIResponsesFunctionCallArgumentsDoneEventSchema.parse(event);
    const toolCallState = readToolCallState(state.toolCallStates, raw.output_index);

    toolCallState.argumentsText = raw.arguments;
    return;
  }

  if (streamEvent.type === "response.completed") {
    const raw = openAIResponsesCompletedEventSchema.parse(event);
    const usage = createOpenAIResponsesUsage(raw.response.usage);

    if (usage !== undefined) {
      state.usage = usage;
      yield { type: "usage", usage };
    }

    state.finishReason = state.toolCallStates.size > 0 ? "tool-call" : "stop";
    yield { type: "finish", finishReason: state.finishReason };
  }
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
      throw new LlmIoError("OpenAI Responses stream tool call is missing a function name.");
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
    throw new LlmIoError("OpenAI Responses stream tool call arguments must be a JSON object.");
  }

  return parsed;
}
