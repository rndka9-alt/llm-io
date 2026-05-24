import type { LlmFormat } from "../../core/format";
import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { omitUndefined } from "../../utils/object";
import { createBearerHeaders, joinUrlPath } from "../utils/index";
import { resolveGenericRequestPath } from "./utils/resolve-generic-request-path";

export interface GenericHttpProviderOptions {
  /** Bearer 인증에 사용할 API key입니다. */
  apiKey?: string;
  /** 요청을 보낼 기본 URL입니다. */
  baseUrl: string;
  /** 요청에 추가할 header입니다. */
  headers?: Record<string, string>;
  /** format별 request path를 직접 정할 때 사용합니다. */
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
      url: joinUrlPath(this.baseUrl, this.resolveRequestPath(input.format)),
    });
  }
}
