export interface LlmAssistantMessage {
  role: "assistant";
  content: readonly LlmAssistantContentPart[];
  text: string;
}

export type LlmAssistantContentPart = LlmAssistantTextPart;

export interface LlmAssistantTextPart {
  type: "text";
  text: string;
}

export interface LlmReasoning {
  text: string;
}

export interface LlmUsage {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
}

export type LlmFinishReason = "stop" | "length" | "tool-call" | "content-filter" | "unknown";

export interface LlmOutput<TRaw, TExtras = undefined> {
  message: LlmAssistantMessage;
  reasoning?: LlmReasoning;
  usage?: LlmUsage;
  finishReason?: LlmFinishReason;
  raw: TRaw;
  extras?: TExtras;
}

export function createTextAssistantMessage(text: string): LlmAssistantMessage {
  return {
    role: "assistant",
    content: [{ type: "text", text }],
    text,
  };
}
