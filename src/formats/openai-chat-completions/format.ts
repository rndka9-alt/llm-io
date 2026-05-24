import type { LlmFormat } from "../../core/format";
import type { JsonObject } from "../../types/json";
import type { LlmRequest } from "../../core/message";
import type { LlmOutput } from "../../core/output";
import { omitUndefined } from "../../utils/object";
import { createOpenAIChatCompletionsRequestBody } from "./create-request-body";
import type { OpenAIChatCompletionsRaw } from "./raw-schema";
import { parseOpenAIChatCompletionsResponse } from "./parse-response";
import { parseOpenAIChatCompletionsStream } from "./parse-stream";
import type { OpenAIChatCompletionsExtraBody } from "./types";
import type { LlmStreamEvent } from "../../core/stream";

export interface OpenAIChatCompletionsFormatOptions {
  model: string;
  extraBody?: OpenAIChatCompletionsExtraBody;
}

export class OpenAIChatCompletionsFormat implements LlmFormat<OpenAIChatCompletionsRaw> {
  readonly id = "openai-chat-completions";
  private readonly extraBody: OpenAIChatCompletionsExtraBody | undefined;
  readonly model: string;

  constructor(options: OpenAIChatCompletionsFormatOptions) {
    this.model = options.model;
    this.extraBody = options.extraBody;
  }

  createRequestBody(request: LlmRequest): JsonObject {
    return createOpenAIChatCompletionsRequestBody(
      request,
      omitUndefined({
        model: this.model,
        extraBody: this.extraBody,
      }),
    );
  }

  createStreamRequestBody(request: LlmRequest): JsonObject {
    return {
      ...this.createRequestBody(request),
      stream: true,
    };
  }

  parseResponse(responseJson: unknown): LlmOutput<OpenAIChatCompletionsRaw> {
    return parseOpenAIChatCompletionsResponse(responseJson);
  }

  parseStream(events: AsyncIterable<unknown>): AsyncIterable<LlmStreamEvent> {
    return parseOpenAIChatCompletionsStream(events);
  }
}
