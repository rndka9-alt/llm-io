import type { LlmToolCall } from "./message";
import type { LlmAssistantMessage, LlmFinishReason, LlmReasoning, LlmUsage } from "./output";

export type LlmStreamEvent =
  | LlmTextDeltaStreamEvent
  | LlmReasoningDeltaStreamEvent
  | LlmToolCallDeltaStreamEvent
  | LlmToolCallStreamEvent
  | LlmUsageStreamEvent
  | LlmFinishStreamEvent
  | LlmDoneStreamEvent;

export interface LlmTextDeltaStreamEvent {
  type: "text-delta";
  text: string;
}

export interface LlmReasoningDeltaStreamEvent {
  type: "reasoning-delta";
  text: string;
}

export interface LlmToolCallDeltaStreamEvent {
  argumentsTextDelta?: string;
  id?: string;
  index: number;
  name?: string;
  type: "tool-call-delta";
}

export interface LlmToolCallStreamEvent {
  toolCall: LlmToolCall;
  type: "tool-call";
}

export interface LlmUsageStreamEvent {
  type: "usage";
  usage: LlmUsage;
}

export interface LlmFinishStreamEvent {
  finishReason: LlmFinishReason;
  type: "finish";
}

export interface LlmDoneStreamEvent {
  finishReason?: LlmFinishReason;
  message: LlmAssistantMessage;
  reasoning?: LlmReasoning;
  toolCalls?: readonly LlmToolCall[];
  type: "done";
  usage?: LlmUsage;
}
