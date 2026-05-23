import { LlmHttpError } from "./core/errors.js";
import type { LlmFormat } from "./core/format.js";
import type { LlmRequest } from "./core/message.js";
import type { LlmOutput } from "./core/output.js";
import type { FetchLike } from "./transport/fetch-like.js";

export interface LlmOptions<TRaw, TExtras = undefined> {
  apiKey?: string;
  baseUrl: string;
  fetch?: FetchLike;
  format: LlmFormat<TRaw, TExtras>;
  headers?: Record<string, string>;
}

export class Llm<TRaw, TExtras = undefined> {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly fetchImplementation: FetchLike;
  private readonly format: LlmFormat<TRaw, TExtras>;
  private readonly headers: Record<string, string>;

  constructor(options: LlmOptions<TRaw, TExtras>) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.fetchImplementation = options.fetch ?? fetch;
    this.format = options.format;
    this.headers = options.headers ?? {};
  }

  async generate(request: LlmRequest): Promise<LlmOutput<TRaw, TExtras>> {
    const requestInit = {
      body: JSON.stringify(this.format.createRequestBody(request)),
      headers: this.createHeaders(),
      method: "POST",
    };

    const response = await this.fetchImplementation(
      this.createRequestUrl(),
      request.signal === undefined ? requestInit : { ...requestInit, signal: request.signal },
    );

    const responseText = await response.text();

    if (!response.ok) {
      throw new LlmHttpError(response.status, responseText);
    }

    const responseJson = JSON.parse(responseText);

    return this.format.parseResponse(responseJson);
  }

  private createRequestUrl(): string {
    return `${this.baseUrl}${this.format.requestPath ?? ""}`;
  }

  private createHeaders(): Record<string, string> {
    return {
      "content-type": "application/json",
      ...this.headers,
      ...(this.apiKey === undefined ? {} : { authorization: `Bearer ${this.apiKey}` }),
    };
  }
}

export type HttpLlmContainerOptions<TRaw, TExtras = undefined> = LlmOptions<TRaw, TExtras>;
export const HttpLlmContainer = Llm;
