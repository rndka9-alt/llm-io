import { z } from "zod";

export const LLM_FORMAT_IDS = {
  anthropicMessages: "anthropic-messages",
  geminiGenerateContent: "gemini-generate-content",
  ollamaChat: "ollama-chat",
  openaiChatCompletions: "openai-chat-completions",
  openaiResponses: "openai-responses",
} as const;

export const llmFormatIdSchema = z.enum([
  LLM_FORMAT_IDS.anthropicMessages,
  LLM_FORMAT_IDS.geminiGenerateContent,
  LLM_FORMAT_IDS.ollamaChat,
  LLM_FORMAT_IDS.openaiChatCompletions,
  LLM_FORMAT_IDS.openaiResponses,
]);

export type BuiltInLlmFormatId = z.infer<typeof llmFormatIdSchema>;
export type CustomLlmFormatId = string & {};
export type AnyLlmFormatId = BuiltInLlmFormatId | CustomLlmFormatId;

export type OpenAICompatibleFormatId =
  | typeof LLM_FORMAT_IDS.openaiChatCompletions
  | typeof LLM_FORMAT_IDS.openaiResponses;
