import type { LlmFormat } from "../../core/format";
import type { JsonObject } from "../../core/json";
import type { LlmRequest } from "../../core/message";
import type { LlmOutput } from "../../core/output";
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
    return createOllamaChatRequestBody(request, {
      model: this.model,
      ...(this.extraBody === undefined ? {} : { extraBody: this.extraBody }),
    });
  }

  parseResponse(responseJson: unknown): LlmOutput<OllamaChatRaw, OllamaChatExtras> {
    return parseOllamaChatResponse(responseJson);
  }
}
