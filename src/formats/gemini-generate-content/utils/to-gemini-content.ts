import { LlmIoError } from "../../../core/errors";
import type { JsonValue } from "../../../types/json";
import { isJsonObject } from "../../../utils/json";
import type { LlmMessage, LlmToolCallPart, LlmToolResultPart } from "../../../core/message";
import { getMessageText } from "../../../core/message";

export function toGeminiContent(message: LlmMessage): {
  parts: (
    | { functionCall: { args: JsonValue; name: string } }
    | { functionResponse: { name: string; response: JsonValue } }
    | { text: string }
  )[];
  role: "model" | "user";
} {
  validateGeminiToolContent(message);

  const parts = message.content.map((contentPart) => {
    if (contentPart.type === "text") {
      return { text: contentPart.text };
    }

    if (contentPart.type === "tool-call") {
      return {
        functionCall: {
          name: contentPart.name,
          args: contentPart.arguments,
        },
      };
    }

    if (contentPart.type === "tool-result") {
      return {
        functionResponse: {
          name: contentPart.name,
          response: normalizeGeminiFunctionResponse(contentPart.result),
        },
      };
    }

    throw new LlmIoError(`Gemini messages do not support ${contentPart.type} content parts.`);
  });

  return {
    role: message.role === "assistant" ? "model" : "user",
    parts: parts.length === 0 ? [{ text: getMessageText(message) }] : parts,
  };
}

function normalizeGeminiFunctionResponse(result: JsonValue): JsonValue {
  if (isJsonObject(result)) {
    return result;
  }

  return { result };
}

function validateGeminiToolContent(message: LlmMessage): void {
  const toolCalls = message.content.filter(isToolCallPart);
  const toolResults = message.content.filter(isToolResultPart);

  if (toolCalls.length > 0 && toolResults.length > 0) {
    throw new LlmIoError("Gemini messages cannot mix tool-call and tool-result content parts.");
  }

  if (toolCalls.length > 0 && message.role !== "assistant") {
    throw new LlmIoError("Gemini tool-call content parts require assistant messages.");
  }

  if (toolResults.length > 0 && message.role !== "tool") {
    throw new LlmIoError("Gemini tool-result content parts require tool messages.");
  }

  if (message.role === "tool" && toolResults.length === 0) {
    throw new LlmIoError("Gemini tool messages require a tool-result content part.");
  }

  if (toolResults.length > 0 && message.content.length !== toolResults.length) {
    throw new LlmIoError("Gemini tool messages support only tool-result content parts.");
  }
}

function isToolCallPart(
  contentPart: LlmMessage["content"][number],
): contentPart is LlmToolCallPart {
  return contentPart.type === "tool-call";
}

function isToolResultPart(
  contentPart: LlmMessage["content"][number],
): contentPart is LlmToolResultPart {
  return contentPart.type === "tool-result";
}
