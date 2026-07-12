import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { omitUndefined } from "../../utils/object";
import {
  createBearerHeaders,
  createStreamRequestBody,
  joinUrlPath,
  readProviderStream,
} from "../utils/index";
import { resolveLLMGatewayRequestPath } from "./utils/resolve-llm-gateway-request-path";

export interface LLMGatewayProviderOptions {
  /** Bearer 인증에 사용할 API key입니다. */
  apiKey?: string;
  /** managed cloud 또는 self-hosted endpoint를 지정합니다. */
  baseUrl?: string;
  /** 요청에 추가할 header입니다. */
  headers?: Record<string, string>;
}

export class LLMGatewayProvider implements LlmProvider {
  readonly id = "llm-gateway";
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string> | undefined;

  constructor(options: LLMGatewayProviderOptions = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? "https://api.llmgateway.io/v1";
    this.headers = options.headers;
  }

  createRequest(input: LlmProviderRequestInput): LlmProviderRequest {
    return omitUndefined({
      body: input.format.createRequestBody(input.request),
      headers: createBearerHeaders(
        omitUndefined({
          apiKey: this.apiKey,
          headers: this.headers,
        }),
      ),
      method: "POST",
      signal: input.request.signal,
      url: joinUrlPath(this.baseUrl, resolveLLMGatewayRequestPath(input.format)),
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
}
