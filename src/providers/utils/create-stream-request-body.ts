import { LlmIoError } from "../../core/errors";
import type { LlmFormat } from "../../core/format";
import type { JsonObject, JsonValue } from "../../types/json";
import { isJsonObject } from "../../utils/json";

export function createStreamRequestBody(
  providerId: string,
  format: LlmFormat<unknown, unknown>,
  body: JsonValue,
): JsonObject {
  if (!isJsonObject(body)) {
    throw new LlmIoError(`${providerId} streaming request body must be a JSON object.`);
  }

  if (format.id === "gemini-generate-content") {
    return body;
  }

  if (
    format.id === "anthropic-messages" ||
    format.id === "ollama-chat" ||
    format.id === "openai-chat-completions" ||
    format.id === "openai-responses"
  ) {
    return {
      ...body,
      stream: true,
    };
  }

  throw new LlmIoError(`${providerId} provider does not support streaming for ${format.id}.`);
}
