import type { LlmFormat } from "../../core/format.js";
import type { LlmRequest } from "../../core/message.js";
import type { LlmOutput } from "../../core/output.js";
import { createOllamaChatRequestBody } from "./create-request-body.js";
import type { OllamaChatRaw } from "./raw-schema.js";
import { parseOllamaChatResponse, type OllamaChatExtras } from "./parse-response.js";

export interface OllamaChatFormatOptions {
  extraBody?: Record<string, unknown>;
  model: string;
}

export class OllamaChatFormat implements LlmFormat<OllamaChatRaw, OllamaChatExtras> {
  readonly id = "ollama-chat";
  private readonly extraBody: Record<string, unknown> | undefined;
  readonly model: string;

  constructor(options: OllamaChatFormatOptions) {
    this.extraBody = options.extraBody;
    this.model = options.model;
  }

  createRequestBody(request: LlmRequest): Record<string, unknown> {
    return createOllamaChatRequestBody(request, {
      model: this.model,
      ...(this.extraBody === undefined ? {} : { extraBody: this.extraBody }),
    });
  }

  parseResponse(responseJson: unknown): LlmOutput<OllamaChatRaw, OllamaChatExtras> {
    return parseOllamaChatResponse(responseJson);
  }
}
