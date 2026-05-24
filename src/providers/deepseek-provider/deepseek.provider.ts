import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { omitUndefined } from "../../utils/object";
import {
  createBearerHeaders,
  createStreamRequestBody,
  joinUrlPath,
  readProviderStream,
} from "../utils/index";
import { resolveDeepSeekRequestPath } from "./utils/resolve-deepseek-request-path";

export interface DeepSeekProviderOptions {
  /** Anthropic 호환 요청에 사용할 version header입니다. */
  anthropicVersion?: string;
  /** 요청 인증에 사용할 API key입니다. */
  apiKey?: string;
  /** 기본 DeepSeek endpoint를 바꿀 때 사용합니다. */
  baseUrl?: string;
  /** 요청에 추가할 header입니다. */
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
    return omitUndefined({
      body: input.format.createRequestBody(input.request),
      headers: this.createHeaders(input),
      method: "POST",
      signal: input.request.signal,
      url: joinUrlPath(this.baseUrl, resolveDeepSeekRequestPath(input.format)),
    });
  }

  createStreamRequest(input: LlmProviderRequestInput): LlmProviderRequest {
    const providerRequest = this.createRequest(input);

    return {
      ...providerRequest,
      body: createStreamRequestBody(this.id, input.format, providerRequest.body),
    };
  }

  readStream(
    body: ReadableStream<Uint8Array>,
    format: LlmProviderRequestInput["format"],
  ): AsyncIterable<unknown> {
    return readProviderStream(this.id, body, format);
  }

  private createHeaders(input: LlmProviderRequestInput): Record<string, string> {
    if (input.format.id === "anthropic-messages") {
      return {
        "content-type": "application/json",
        ...this.headers,
        ...omitUndefined({ "x-api-key": this.apiKey }),
        "anthropic-version": this.anthropicVersion,
      };
    }

    return createBearerHeaders(
      omitUndefined({
        apiKey: this.apiKey,
        headers: this.headers,
      }),
    );
  }
}
