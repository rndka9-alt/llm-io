import type { LlmFormat } from "../../core/format";
import type { JsonObject } from "../../types/json";
import type { LlmRequest } from "../../core/message";
import type { LlmOutput } from "../../core/output";
import { omitUndefined } from "../../utils/object";
import { createAnthropicMessagesRequestBody } from "./create-request-body";
import { parseAnthropicMessagesResponse } from "./parse-response";
import type { AnthropicMessagesRaw } from "./raw-schema";
import type { AnthropicMessagesExtraBody } from "./types";

export interface AnthropicMessagesFormatOptions {
  extraBody?: AnthropicMessagesExtraBody;
  maxTokens: number;
  model: string;
}

export class AnthropicMessagesFormat implements LlmFormat<AnthropicMessagesRaw> {
  readonly id = "anthropic-messages";
  readonly model: string;
  private readonly extraBody: AnthropicMessagesExtraBody | undefined;
  private readonly maxTokens: number;

  constructor(options: AnthropicMessagesFormatOptions) {
    this.extraBody = options.extraBody;
    this.maxTokens = options.maxTokens;
    this.model = options.model;
  }

  createRequestBody(request: LlmRequest): JsonObject {
    return createAnthropicMessagesRequestBody(
      request,
      omitUndefined({
        extraBody: this.extraBody,
        maxTokens: this.maxTokens,
        model: this.model,
      }),
    );
  }

  parseResponse(responseJson: unknown): LlmOutput<AnthropicMessagesRaw> {
    return parseAnthropicMessagesResponse(responseJson);
  }
}
