import type { LlmFormat } from "../../core/format";
import type { JsonObject } from "../../core/json";
import type { LlmRequest } from "../../core/message";
import type { LlmOutput } from "../../core/output";
import { createOpenAIResponsesRequestBody } from "./create-request-body";
import type { OpenAIResponsesRaw } from "./raw-schema";
import { parseOpenAIResponsesResponse, type OpenAIResponsesExtras } from "./parse-response";
import type { OpenAIResponsesExtraBody } from "./types";

export interface OpenAIResponsesFormatOptions {
  model: string;
  extraBody?: OpenAIResponsesExtraBody;
}

export class OpenAIResponsesFormat implements LlmFormat<OpenAIResponsesRaw, OpenAIResponsesExtras> {
  readonly id = "openai-responses";
  private readonly extraBody: OpenAIResponsesExtraBody | undefined;
  readonly model: string;

  constructor(options: OpenAIResponsesFormatOptions) {
    this.model = options.model;
    this.extraBody = options.extraBody;
  }

  createRequestBody(request: LlmRequest): JsonObject {
    return createOpenAIResponsesRequestBody(request, {
      model: this.model,
      ...(this.extraBody === undefined ? {} : { extraBody: this.extraBody }),
    });
  }

  parseResponse(responseJson: unknown): LlmOutput<OpenAIResponsesRaw, OpenAIResponsesExtras> {
    return parseOpenAIResponsesResponse(responseJson);
  }
}
