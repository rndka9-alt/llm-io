import { LlmIoError } from "../../core/errors";
import type { LlmFormat } from "../../core/format";
import { LLM_FORMAT_IDS } from "../../core/format-id";
import { readNdjsonJsonStream } from "../../utils/ndjson";
import { readSseJsonStream } from "../../utils/sse";

export function readProviderStream(
  providerId: string,
  body: ReadableStream<Uint8Array>,
  format: LlmFormat<unknown, unknown, string>,
): AsyncIterable<unknown> {
  if (format.id === LLM_FORMAT_IDS.ollamaChat) {
    return readNdjsonJsonStream(body);
  }

  if (
    format.id === LLM_FORMAT_IDS.anthropicMessages ||
    format.id === LLM_FORMAT_IDS.geminiGenerateContent ||
    format.id === LLM_FORMAT_IDS.openaiChatCompletions ||
    format.id === LLM_FORMAT_IDS.openaiResponses
  ) {
    return readSseJsonStream(body);
  }

  throw new LlmIoError(`${providerId} provider does not support streaming for ${format.id}.`);
}
