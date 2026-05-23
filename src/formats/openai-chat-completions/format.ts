import type { LlmFormat } from "../../core/format";
import type { LlmRequest } from "../../core/message";
import type { LlmOutput } from "../../core/output";
import { createOpenAIChatCompletionsRequestBody } from "./create-request-body";
import type { OpenAIChatCompletionsRaw } from "./raw-schema";
import { parseOpenAIChatCompletionsResponse } from "./parse-response";

export interface OpenAIChatCompletionsFormatOptions {
  model: string;
  extraBody?: Record<string, unknown>;
}

export class OpenAIChatCompletionsFormat implements LlmFormat<OpenAIChatCompletionsRaw> {
  readonly id = "openai-chat-completions";
  private readonly extraBody: Record<string, unknown> | undefined;
  readonly model: string;

  constructor(options: OpenAIChatCompletionsFormatOptions) {
    this.model = options.model;
    this.extraBody = options.extraBody;
  }

  createRequestBody(request: LlmRequest): Record<string, unknown> {
    return createOpenAIChatCompletionsRequestBody(request, {
      model: this.model,
      ...(this.extraBody === undefined ? {} : { extraBody: this.extraBody }),
    });
  }

  parseResponse(responseJson: unknown): LlmOutput<OpenAIChatCompletionsRaw> {
    return parseOpenAIChatCompletionsResponse(responseJson);
  }
}
