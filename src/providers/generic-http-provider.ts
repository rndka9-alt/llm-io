import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../core/provider.js";
import { createBearerHeaders, joinUrlPath } from "./utils.js";

export interface GenericHttpProviderOptions {
  apiKey?: string;
  baseUrl: string;
  headers?: Record<string, string>;
}

export class GenericHttpProvider implements LlmProvider {
  readonly id: string = "generic-http";
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string> | undefined;

  constructor(options: GenericHttpProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl;
    this.headers = options.headers;
  }

  createRequest(input: LlmProviderRequestInput): LlmProviderRequest {
    return {
      body: input.body,
      headers: createBearerHeaders({
        ...(this.apiKey === undefined ? {} : { apiKey: this.apiKey }),
        ...(this.headers === undefined ? {} : { headers: this.headers }),
      }),
      method: "POST",
      ...(input.signal === undefined ? {} : { signal: input.signal }),
      url: joinUrlPath(this.baseUrl, input.requestPath),
    };
  }
}
