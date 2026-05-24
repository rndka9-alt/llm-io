import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { omitUndefined } from "../../utils/object";
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
    return omitUndefined({
      body: input.format.createRequestBody(input.request),
      headers: createBearerHeaders(
        omitUndefined({
          apiKey: this.apiKey,
          headers: {
            ...this.headers,
            ...omitUndefined({
              "HTTP-Referer": this.siteUrl,
              "X-OpenRouter-Title": this.appName,
            }),
          },
        }),
      ),
      method: "POST",
      signal: input.request.signal,
      url: joinUrlPath(this.baseUrl, resolveOpenRouterRequestPath(input.format)),
    });
  }
}
