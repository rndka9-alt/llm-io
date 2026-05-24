import type { LlmFormat } from "../../core/format";
import { LLM_FORMAT_IDS } from "../../core/format-id";
import type { JsonObject } from "../../types/json";
import type { LlmRequest } from "../../core/message";
import type { LlmOutput } from "../../core/output";
import { omitUndefined } from "../../utils/object";
import { createOpenAIResponsesRequestBody } from "./create-request-body";
import type { OpenAIResponsesRaw } from "./raw-schema";
import { parseOpenAIResponsesResponse, type OpenAIResponsesExtras } from "./parse-response";
import { parseOpenAIResponsesStream } from "./parse-stream";
import type { OpenAIResponsesExtraBody } from "./types";
import type { LlmStreamEvent } from "../../core/stream";

export interface OpenAIResponsesFormatOptions {
  /** 요청 body에 넣을 model id입니다. */
  model: string;
  /** Responses body에 추가할 format 전용 옵션입니다. */
  extraBody?: OpenAIResponsesExtraBody;
}

export class OpenAIResponsesFormat implements LlmFormat<OpenAIResponsesRaw, OpenAIResponsesExtras> {
  readonly id = LLM_FORMAT_IDS.openaiResponses;
  private readonly extraBody: OpenAIResponsesExtraBody | undefined;
  readonly model: string;

  constructor(options: OpenAIResponsesFormatOptions) {
    this.model = options.model;
    this.extraBody = options.extraBody;
  }

  createRequestBody(request: LlmRequest): JsonObject {
    return createOpenAIResponsesRequestBody(
      request,
      omitUndefined({
        model: this.model,
        extraBody: this.extraBody,
      }),
    );
  }

  parseResponse(responseJson: unknown): LlmOutput<OpenAIResponsesRaw, OpenAIResponsesExtras> {
    return parseOpenAIResponsesResponse(responseJson);
  }

  parseStream(events: AsyncIterable<unknown>): AsyncIterable<LlmStreamEvent> {
    return parseOpenAIResponsesStream(events);
  }
}
