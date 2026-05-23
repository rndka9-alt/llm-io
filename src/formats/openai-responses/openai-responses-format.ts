import type { LlmFormat } from "../../core/format.js";
import type { LlmRequest } from "../../core/message.js";
import type { LlmOutput } from "../../core/output.js";
import { createOpenAIResponsesRequestBody } from "./create-openai-responses-request-body.js";
import type { OpenAIResponsesRaw } from "./openai-responses-raw-schema.js";
import {
  parseOpenAIResponsesResponse,
  type OpenAIResponsesExtras,
} from "./parse-openai-responses-response.js";

export interface OpenAIResponsesFormatOptions {
  model: string;
  extraBody?: Record<string, unknown>;
}

export class OpenAIResponsesFormat implements LlmFormat<OpenAIResponsesRaw, OpenAIResponsesExtras> {
  readonly id = "openai-responses";
  readonly requestPath = "/responses";
  private readonly extraBody: Record<string, unknown> | undefined;
  private readonly model: string;

  constructor(options: OpenAIResponsesFormatOptions) {
    this.model = options.model;
    this.extraBody = options.extraBody;
  }

  createRequestBody(request: LlmRequest): Record<string, unknown> {
    return createOpenAIResponsesRequestBody(request, {
      model: this.model,
      ...(this.extraBody === undefined ? {} : { extraBody: this.extraBody }),
    });
  }

  parseResponse(responseJson: unknown): LlmOutput<OpenAIResponsesRaw, OpenAIResponsesExtras> {
    return parseOpenAIResponsesResponse(responseJson);
  }
}
