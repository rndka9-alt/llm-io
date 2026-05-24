import { LlmIoError } from "../../core/errors";
import type { LlmFormat } from "../../core/format";
import { readNdjsonJsonStream } from "../../utils/ndjson";
import { readSseJsonStream } from "../../utils/sse";

export function readProviderStream(
  providerId: string,
  body: ReadableStream<Uint8Array>,
  format: LlmFormat<unknown, unknown>,
): AsyncIterable<unknown> {
  if (format.id === "ollama-chat") {
    return readNdjsonJsonStream(body);
  }

  if (
    format.id === "anthropic-messages" ||
    format.id === "gemini-generate-content" ||
    format.id === "openai-chat-completions" ||
    format.id === "openai-responses"
  ) {
    return readSseJsonStream(body);
  }

  throw new LlmIoError(`${providerId} provider does not support streaming for ${format.id}.`);
}
