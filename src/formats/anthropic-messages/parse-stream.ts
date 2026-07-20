import { z } from "zod/v4";

import { LlmIoError } from "../../core/errors";
import type { LlmToolCall } from "../../core/message";
import { createAssistantMessage, createReasoning } from "../../core/output";
import type { LlmFinishReason, LlmUsage } from "../../core/output";
import type { LlmStreamEvent } from "../../core/stream";
import type { JsonObject } from "../../types/json";
import { undefinedIfEmptyArray } from "../../utils/array";
import { isJsonObject } from "../../utils/json";
import { omitUndefined } from "../../utils/object";
import { createAnthropicUsage } from "./utils/create-anthropic-usage";
import { normalizeAnthropicFinishReason } from "./utils/normalize-anthropic-finish-reason";

const anthropicStreamEventSchema = z.object({ type: z.string() }).loose();

const anthropicUsageSchema = z
  .object({
    cache_creation_input_tokens: z.number().optional(),
    cache_read_input_tokens: z.number().optional(),
    input_tokens: z.number().optional(),
    output_tokens: z.number().optional(),
  })
  .loose();

const anthropicMessageStartEventSchema = z
  .object({
    message: z
      .object({
        usage: anthropicUsageSchema.optional(),
      })
      .loose(),
    type: z.literal("message_start"),
  })
  .loose();

const anthropicContentBlockStartEventSchema = z
  .object({
    content_block: z
      .object({
        id: z.string().optional(),
        name: z.string().optional(),
        type: z.string(),
      })
      .loose(),
    index: z.number(),
    type: z.literal("content_block_start"),
  })
  .loose();

const anthropicContentBlockDeltaEventSchema = z
  .object({
    delta: z
      .object({
        partial_json: z.string().optional(),
        signature: z.string().optional(),
        text: z.string().optional(),
        thinking: z.string().optional(),
        type: z.string(),
      })
      .loose(),
    index: z.number(),
    type: z.literal("content_block_delta"),
  })
  .loose();

const anthropicMessageDeltaEventSchema = z
  .object({
    delta: z
      .object({
        stop_reason: z.string().nullable().optional(),
      })
      .loose(),
    type: z.literal("message_delta"),
    usage: anthropicUsageSchema.optional(),
  })
  .loose();

const anthropicErrorEventSchema = z
  .object({
    error: z
      .object({
        message: z.string().optional(),
        type: z.string().optional(),
      })
      .loose(),
    type: z.literal("error"),
  })
  .loose();

interface StreamState {
  finishReason?: LlmFinishReason;
  reasoningText: string;
  text: string;
  toolCallStates: Map<number, ToolCallState>;
  usage?: LlmUsage;
}

interface ToolCallState {
  argumentsText: string;
  id?: string;
  name?: string;
}

export async function* parseAnthropicMessagesStream(
  events: AsyncIterable<unknown>,
): AsyncIterable<LlmStreamEvent> {
  const state = createStreamState();

  for await (const event of events) {
    const streamEvent = anthropicStreamEventSchema.parse(event);

    yield* parseAnthropicMessagesStreamEvent(streamEvent, event, state);
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

function* parseAnthropicMessagesStreamEvent(
  streamEvent: z.infer<typeof anthropicStreamEventSchema>,
  event: unknown,
  state: StreamState,
): Iterable<LlmStreamEvent> {
  if (streamEvent.type === "message_start") {
    const raw = anthropicMessageStartEventSchema.parse(event);
    const usage = createAnthropicUsage(raw.message.usage);

    if (usage !== undefined) {
      state.usage = mergeUsage(state.usage, usage);
      yield { type: "usage", usage: state.usage };
    }

    return;
  }

  if (streamEvent.type === "content_block_start") {
    const raw = anthropicContentBlockStartEventSchema.parse(event);

    if (raw.content_block.type === "tool_use") {
      const toolCallState = readToolCallState(state.toolCallStates, raw.index);

      if (raw.content_block.id !== undefined) {
        toolCallState.id = raw.content_block.id;
      }

      if (raw.content_block.name !== undefined) {
        toolCallState.name = raw.content_block.name;
      }

      yield omitUndefined({
        type: "tool-call-delta",
        index: raw.index,
        id: raw.content_block.id,
        name: raw.content_block.name,
      });
    }

    return;
  }

  if (streamEvent.type === "content_block_delta") {
    const raw = anthropicContentBlockDeltaEventSchema.parse(event);

    if (raw.delta.text !== undefined && raw.delta.text.length > 0) {
      state.text += raw.delta.text;
      yield { type: "text-delta", text: raw.delta.text };
      return;
    }

    if (raw.delta.thinking !== undefined && raw.delta.thinking.length > 0) {
      state.reasoningText += raw.delta.thinking;
      yield { type: "reasoning-delta", text: raw.delta.thinking };
      return;
    }

    if (raw.delta.partial_json !== undefined) {
      const toolCallState = readToolCallState(state.toolCallStates, raw.index);

      toolCallState.argumentsText += raw.delta.partial_json;

      yield {
        type: "tool-call-delta",
        index: raw.index,
        argumentsTextDelta: raw.delta.partial_json,
      };
    }

    return;
  }

  if (streamEvent.type === "message_delta") {
    const raw = anthropicMessageDeltaEventSchema.parse(event);
    const usage = createAnthropicUsage(raw.usage);
    const finishReason = normalizeAnthropicFinishReason(raw.delta.stop_reason);

    if (usage !== undefined) {
      state.usage = mergeUsage(state.usage, usage);
      yield { type: "usage", usage: state.usage };
    }

    if (finishReason !== undefined) {
      state.finishReason = finishReason;
      yield { type: "finish", finishReason };
    }

    return;
  }

  if (streamEvent.type === "error") {
    const raw = anthropicErrorEventSchema.parse(event);
    throw new LlmIoError(raw.error.message ?? "Anthropic stream returned an error.");
  }
}

function mergeUsage(previous: LlmUsage | undefined, next: LlmUsage): LlmUsage {
  const inputTokens = next.inputTokens ?? previous?.inputTokens;
  const outputTokens = next.outputTokens ?? previous?.outputTokens;

  return omitUndefined({
    cacheCreationInputTokens: next.cacheCreationInputTokens ?? previous?.cacheCreationInputTokens,
    cacheReadInputTokens: next.cacheReadInputTokens ?? previous?.cacheReadInputTokens,
    details: next.details ?? previous?.details,
    inputTokens,
    outputTokens,
    reasoningTokens: next.reasoningTokens ?? previous?.reasoningTokens,
    totalTokens: createTotalTokens(inputTokens, outputTokens),
  });
}

function createTotalTokens(
  inputTokens: number | undefined,
  outputTokens: number | undefined,
): number | undefined {
  if (inputTokens === undefined || outputTokens === undefined) {
    return undefined;
  }

  return inputTokens + outputTokens;
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
      throw new LlmIoError("Anthropic stream tool call is missing a tool name.");
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
    throw new LlmIoError("Anthropic stream tool call arguments must be a JSON object.");
  }

  return parsed;
}
