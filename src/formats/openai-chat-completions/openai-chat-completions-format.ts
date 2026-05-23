import type { LlmFormat } from "../../core/format.js";
import type { LlmRequest } from "../../core/message.js";
import type { LlmOutput } from "../../core/output.js";
import { createOpenAIChatCompletionsRequestBody } from "./create-openai-chat-completions-request-body.js";
import type { OpenAIChatCompletionsRaw } from "./openai-chat-completions-raw-schema.js";
import { parseOpenAIChatCompletionsResponse } from "./parse-openai-chat-completions-response.js";

export interface OpenAIChatCompletionsFormatOptions {
  model: string;
  extraBody?: Record<string, unknown>;
}

export class OpenAIChatCompletionsFormat implements LlmFormat<OpenAIChatCompletionsRaw> {
  readonly id = "openai-chat-completions";
  readonly requestPath = "/chat/completions";
  private readonly extraBody: Record<string, unknown> | undefined;
  private readonly model: string;

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
