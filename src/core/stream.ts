import type { LlmToolCall } from "./message";
import type { LlmAssistantMessage, LlmFinishReason, LlmReasoning, LlmUsage } from "./output";

/** Llm.stream()이 반환하는 provider 중립 event입니다. */
export type LlmStreamEvent =
  | LlmTextDeltaStreamEvent
  | LlmReasoningDeltaStreamEvent
  | LlmToolCallDeltaStreamEvent
  | LlmToolCallStreamEvent
  | LlmUsageStreamEvent
  | LlmFinishStreamEvent
  | LlmDoneStreamEvent;

/** 사용자에게 보여줄 text delta입니다. */
export interface LlmTextDeltaStreamEvent {
  type: "text-delta";
  text: string;
}

/** 모델 reasoning delta입니다. */
export interface LlmReasoningDeltaStreamEvent {
  type: "reasoning-delta";
  text: string;
}

/** 완성 전 tool-call delta입니다. */
export interface LlmToolCallDeltaStreamEvent {
  argumentsTextDelta?: string;
  id?: string;
  index: number;
  name?: string;
  type: "tool-call-delta";
}

/** arguments까지 파싱된 tool call입니다. */
export interface LlmToolCallStreamEvent {
  toolCall: LlmToolCall;
  type: "tool-call";
}

/** token usage입니다. */
export interface LlmUsageStreamEvent {
  type: "usage";
  usage: LlmUsage;
}

/** 모델 stop reason입니다. */
export interface LlmFinishStreamEvent {
  finishReason: LlmFinishReason;
  type: "finish";
}

/** stream을 재구성한 최종 assistant message입니다. */
export interface LlmDoneStreamEvent {
  finishReason?: LlmFinishReason;
  message: LlmAssistantMessage;
  reasoning?: LlmReasoning;
  toolCalls?: readonly LlmToolCall[];
  type: "done";
  usage?: LlmUsage;
}
