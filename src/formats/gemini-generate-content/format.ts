import type { LlmFormat } from "../../core/format";
import type { JsonObject } from "../../types/json";
import type { LlmRequest } from "../../core/message";
import type { LlmOutput } from "../../core/output";
import { omitUndefined } from "../../utils/object";
import { createGeminiGenerateContentRequestBody } from "./create-request-body";
import type { GeminiGenerateContentRaw } from "./raw-schema";
import { parseGeminiGenerateContentResponse } from "./parse-response";
import type { GeminiGenerateContentExtraBody } from "./types";

export interface GeminiGenerateContentFormatOptions {
  /** GenerateContent body에 추가할 format 전용 옵션입니다. */
  extraBody?: GeminiGenerateContentExtraBody;
  /** 요청 path에 넣을 model id입니다. */
  model: string;
}

export class GeminiGenerateContentFormat implements LlmFormat<GeminiGenerateContentRaw> {
  readonly id = "gemini-generate-content";
  readonly model: string;
  private readonly extraBody: GeminiGenerateContentExtraBody | undefined;

  constructor(options: GeminiGenerateContentFormatOptions) {
    this.extraBody = options.extraBody;
    this.model = options.model;
  }

  createRequestBody(request: LlmRequest): JsonObject {
    return createGeminiGenerateContentRequestBody(
      request,
      omitUndefined({
        extraBody: this.extraBody,
      }),
    );
  }

  parseResponse(responseJson: unknown): LlmOutput<GeminiGenerateContentRaw> {
    return parseGeminiGenerateContentResponse(responseJson);
  }
}
