import { LlmIoError } from "../../core/errors";
import type { LlmFormat } from "../../core/format";
import { LLM_FORMAT_IDS } from "../../core/format-id";
import type { JsonObject, JsonValue } from "../../types/json";
import { isJsonObject } from "../../utils/json";

export function createStreamRequestBody(
  providerId: string,
  format: LlmFormat<unknown, unknown, string>,
  body: JsonValue,
): JsonObject {
  if (!isJsonObject(body)) {
    throw new LlmIoError(`${providerId} streaming request body must be a JSON object.`);
  }

  if (format.id === LLM_FORMAT_IDS.geminiGenerateContent) {
    return body;
  }

  if (
    format.id === LLM_FORMAT_IDS.anthropicMessages ||
    format.id === LLM_FORMAT_IDS.ollamaChat ||
    format.id === LLM_FORMAT_IDS.openaiChatCompletions ||
    format.id === LLM_FORMAT_IDS.openaiResponses
  ) {
    return {
      ...body,
      stream: true,
    };
  }

  throw new LlmIoError(`${providerId} provider does not support streaming for ${format.id}.`);
}
