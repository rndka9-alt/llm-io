import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { createBearerHeaders, joinUrlPath } from "../utils/index";
import { resolveOpenRouterRequestPath } from "./utils/resolve-openrouter-request-path";

export interface OpenRouterProviderOptions {
  apiKey?: string;
  appName?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  siteUrl?: string;
}

export class OpenRouterProvider implements LlmProvider {
  readonly id = "openrouter";
  private readonly apiKey: string | undefined;
  private readonly appName: string | undefined;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string> | undefined;
  private readonly siteUrl: string | undefined;

  constructor(options: OpenRouterProviderOptions = {}) {
    this.apiKey = options.apiKey;
    this.appName = options.appName;
    this.baseUrl = options.baseUrl ?? "https://openrouter.ai/api/v1";
    this.headers = options.headers;
    this.siteUrl = options.siteUrl;
  }

  createRequest(input: LlmProviderRequestInput): LlmProviderRequest {
    return {
      body: input.format.createRequestBody(input.request),
      headers: createBearerHeaders({
        ...(this.apiKey === undefined ? {} : { apiKey: this.apiKey }),
        headers: {
          ...this.headers,
          ...(this.siteUrl === undefined ? {} : { "HTTP-Referer": this.siteUrl }),
          ...(this.appName === undefined ? {} : { "X-OpenRouter-Title": this.appName }),
        },
      }),
      method: "POST",
      ...(input.request.signal === undefined ? {} : { signal: input.request.signal }),
      url: joinUrlPath(this.baseUrl, resolveOpenRouterRequestPath(input.format)),
    };
  }
}
