import type { LlmFormat } from "../core/format";
import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../core/provider";
import { createBearerHeaders, joinUrlPath, resolveGenericRequestPath } from "./utils/index";

export interface GenericHttpProviderOptions {
  apiKey?: string;
  baseUrl: string;
  headers?: Record<string, string>;
  resolveRequestPath?: (format: LlmFormat<unknown, unknown>) => string | undefined;
}

export class GenericHttpProvider implements LlmProvider {
  readonly id: string = "generic-http";
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string> | undefined;
  private readonly resolveRequestPath: (format: LlmFormat<unknown, unknown>) => string | undefined;

  constructor(options: GenericHttpProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl;
    this.headers = options.headers;
    this.resolveRequestPath = options.resolveRequestPath ?? resolveGenericRequestPath;
  }

  createRequest(input: LlmProviderRequestInput): LlmProviderRequest {
    return {
      body: input.format.createRequestBody(input.request),
      headers: createBearerHeaders({
        ...(this.apiKey === undefined ? {} : { apiKey: this.apiKey }),
        ...(this.headers === undefined ? {} : { headers: this.headers }),
      }),
      method: "POST",
      ...(input.request.signal === undefined ? {} : { signal: input.request.signal }),
      url: joinUrlPath(this.baseUrl, this.resolveRequestPath(input.format)),
    };
  }
}
