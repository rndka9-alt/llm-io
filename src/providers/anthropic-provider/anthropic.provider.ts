import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { omitUndefined } from "../../utils/object";
import { joinUrlPath } from "../utils/index";
import { resolveAnthropicRequestPath } from "./utils/resolve-anthropic-request-path";

export interface AnthropicProviderOptions {
  /** anthropic-version header 값입니다. */
  anthropicVersion?: string;
  /** x-api-key header에 넣을 API key입니다. */
  apiKey?: string;
  /** 기본 Anthropic endpoint를 바꿀 때 사용합니다. */
  baseUrl?: string;
  /** 요청에 추가할 header입니다. */
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
    return omitUndefined({
      body: input.format.createRequestBody(input.request),
      headers: {
        "content-type": "application/json",
        ...this.headers,
        ...omitUndefined({ "x-api-key": this.apiKey }),
        "anthropic-version": this.anthropicVersion,
      },
      method: "POST",
      signal: input.request.signal,
      url: joinUrlPath(this.baseUrl, resolveAnthropicRequestPath(input.format)),
    });
  }
}
