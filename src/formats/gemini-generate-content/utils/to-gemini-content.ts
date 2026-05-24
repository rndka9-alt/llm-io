import { isJsonObject } from "../../../core/json";
import type { JsonValue } from "../../../core/json";
import type { LlmMessage } from "../../../core/message";
import { getMessageText } from "../../../core/message";

export function toGeminiContent(message: LlmMessage): {
  parts: (
    | { functionCall: { args: JsonValue; name: string } }
    | { functionResponse: { name: string; response: JsonValue } }
    | { text: string }
  )[];
  role: "model" | "user";
} {
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

    return {
      functionResponse: {
        name: contentPart.name,
        response: normalizeGeminiFunctionResponse(contentPart.result),
      },
    };
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
