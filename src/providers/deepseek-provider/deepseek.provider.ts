import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { createBearerHeaders, joinUrlPath } from "../utils/index";
import { resolveDeepSeekRequestPath } from "./utils/resolve-deepseek-request-path";

export interface DeepSeekProviderOptions {
  anthropicVersion?: string;
  apiKey?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
}

export class DeepSeekProvider implements LlmProvider {
  readonly id = "deepseek";
  private readonly anthropicVersion: string;
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string> | undefined;

  constructor(options: DeepSeekProviderOptions = {}) {
    this.anthropicVersion = options.anthropicVersion ?? "2023-06-01";
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? "https://api.deepseek.com";
    this.headers = options.headers;
  }

  createRequest(input: LlmProviderRequestInput): LlmProviderRequest {
    return {
      body: input.format.createRequestBody(input.request),
      headers: this.createHeaders(input),
      method: "POST",
      ...(input.request.signal === undefined ? {} : { signal: input.request.signal }),
      url: joinUrlPath(this.baseUrl, resolveDeepSeekRequestPath(input.format)),
    };
  }

  private createHeaders(input: LlmProviderRequestInput): Record<string, string> {
    if (input.format.id === "anthropic-messages") {
      return {
        "content-type": "application/json",
        ...this.headers,
        ...(this.apiKey === undefined ? {} : { "x-api-key": this.apiKey }),
        "anthropic-version": this.anthropicVersion,
      };
    }

    return createBearerHeaders({
      ...(this.apiKey === undefined ? {} : { apiKey: this.apiKey }),
      ...(this.headers === undefined ? {} : { headers: this.headers }),
    });
  }
}
