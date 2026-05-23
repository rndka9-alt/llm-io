import type { LlmFormat } from "../../core/format.js";
import type { LlmRequest } from "../../core/message.js";
import type { LlmOutput } from "../../core/output.js";
import { createGeminiGenerateContentRequestBody } from "./create-request-body.js";
import type { GeminiGenerateContentRaw } from "./raw-schema.js";
import { parseGeminiGenerateContentResponse } from "./parse-response.js";

export interface GeminiGenerateContentFormatOptions {
  extraBody?: Record<string, unknown>;
  model: string;
}

export class GeminiGenerateContentFormat implements LlmFormat<GeminiGenerateContentRaw> {
  readonly id = "gemini-generate-content";
  readonly requestPath: string;
  private readonly extraBody: Record<string, unknown> | undefined;

  constructor(options: GeminiGenerateContentFormatOptions) {
    this.extraBody = options.extraBody;
    this.requestPath = `models/${options.model}:generateContent`;
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
