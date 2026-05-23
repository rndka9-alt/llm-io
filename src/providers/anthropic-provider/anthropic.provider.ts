import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { joinUrlPath } from "../utils/index";
import { resolveAnthropicRequestPath } from "./utils/resolve-anthropic-request-path";

export interface AnthropicProviderOptions {
  anthropicVersion?: string;
  apiKey?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
}

export class AnthropicProvider implements LlmProvider {
  readonly id = "anthropic";
  private readonly anthropicVersion: string;
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string> | undefined;

  constructor(options: AnthropicProviderOptions = {}) {
    this.anthropicVersion = options.anthropicVersion ?? "2023-06-01";
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? "https://api.anthropic.com/v1";
    this.headers = options.headers;
  }

  createRequest(input: LlmProviderRequestInput): LlmProviderRequest {
    return {
      body: input.format.createRequestBody(input.request),
      headers: {
        "content-type": "application/json",
        ...this.headers,
        ...(this.apiKey === undefined ? {} : { "x-api-key": this.apiKey }),
        "anthropic-version": this.anthropicVersion,
      },
      method: "POST",
      ...(input.request.signal === undefined ? {} : { signal: input.request.signal }),
      url: joinUrlPath(this.baseUrl, resolveAnthropicRequestPath(input.format)),
    };
  }
}
