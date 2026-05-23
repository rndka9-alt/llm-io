import type { LlmFormat } from "../../core/format";
import type { LlmRequest } from "../../core/message";
import type { LlmOutput } from "../../core/output";
import { createGeminiGenerateContentRequestBody } from "./create-request-body";
import type { GeminiGenerateContentRaw } from "./raw-schema";
import { parseGeminiGenerateContentResponse } from "./parse-response";

export interface GeminiGenerateContentFormatOptions {
  extraBody?: Record<string, unknown>;
  model: string;
}

export class GeminiGenerateContentFormat implements LlmFormat<GeminiGenerateContentRaw> {
  readonly id = "gemini-generate-content";
  readonly model: string;
  private readonly extraBody: Record<string, unknown> | undefined;

  constructor(options: GeminiGenerateContentFormatOptions) {
    this.extraBody = options.extraBody;
    this.model = options.model;
  }

  createRequestBody(request: LlmRequest): Record<string, unknown> {
    return createGeminiGenerateContentRequestBody(request, {
      ...(this.extraBody === undefined ? {} : { extraBody: this.extraBody }),
    });
  }

  parseResponse(responseJson: unknown): LlmOutput<GeminiGenerateContentRaw> {
    return parseGeminiGenerateContentResponse(responseJson);
  }
}
