import type { LlmFormat } from "../../core/format";
import { LLM_FORMAT_IDS } from "../../core/format-id";
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
  /** 요청 body에 넣을 model id입니다. */
  model: string;
  /** Chat Completions body에 추가할 format 전용 옵션입니다. */
  extraBody?: OpenAIChatCompletionsExtraBody;
}

export class OpenAIChatCompletionsFormat implements LlmFormat<OpenAIChatCompletionsRaw> {
  readonly id = LLM_FORMAT_IDS.openaiChatCompletions;
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

  parseResponse(responseJson: unknown): LlmOutput<OpenAIChatCompletionsRaw> {
    return parseOpenAIChatCompletionsResponse(responseJson);
  }

  parseStream(events: AsyncIterable<unknown>): AsyncIterable<LlmStreamEvent> {
    return parseOpenAIChatCompletionsStream(events);
  }
}
