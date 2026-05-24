import type { LlmFormat } from "../../core/format";
import type { JsonObject } from "../../types/json";
import type { LlmRequest } from "../../core/message";
import type { LlmOutput } from "../../core/output";
import { omitUndefined } from "../../utils/object";
import { createOllamaChatRequestBody } from "./create-request-body";
import type { OllamaChatRaw } from "./raw-schema";
import { parseOllamaChatResponse, type OllamaChatExtras } from "./parse-response";
import type { OllamaChatExtraBody } from "./types";

export interface OllamaChatFormatOptions {
  extraBody?: OllamaChatExtraBody;
  model: string;
}

export class OllamaChatFormat implements LlmFormat<OllamaChatRaw, OllamaChatExtras> {
  readonly id = "ollama-chat";
  private readonly extraBody: OllamaChatExtraBody | undefined;
  readonly model: string;

  constructor(options: OllamaChatFormatOptions) {
    this.extraBody = options.extraBody;
    this.model = options.model;
  }

  createRequestBody(request: LlmRequest): JsonObject {
    return createOllamaChatRequestBody(
      request,
      omitUndefined({
        model: this.model,
        extraBody: this.extraBody,
      }),
    );
  }

  parseResponse(responseJson: unknown): LlmOutput<OllamaChatRaw, OllamaChatExtras> {
    return parseOllamaChatResponse(responseJson);
  }
}
