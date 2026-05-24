import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { omitUndefined } from "../../utils/object";
import { createBearerHeaders, joinUrlPath } from "../utils/index";
import { resolveNanoGPTRequestPath } from "./utils/resolve-nanogpt-request-path";

export type NanoGPTAuthentication = "bearer" | "x-api-key";

export interface NanoGPTProviderOptions {
  /** 선택한 인증 방식에 사용할 API key입니다. */
  apiKey?: string;
  /** API key를 전달할 header 방식입니다. */
  authentication?: NanoGPTAuthentication;
  /** 기본 NanoGPT endpoint를 바꿀 때 사용합니다. */
  baseUrl?: string;
  /** 요청에 추가할 header입니다. */
  headers?: Record<string, string>;
}

export class NanoGPTProvider implements LlmProvider {
  readonly id = "nanogpt";
  private readonly apiKey: string | undefined;
  private readonly authentication: NanoGPTAuthentication;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string> | undefined;

  constructor(options: NanoGPTProviderOptions = {}) {
    this.apiKey = options.apiKey;
    this.authentication = options.authentication ?? "bearer";
    this.baseUrl = options.baseUrl ?? "https://nano-gpt.com/api/v1";
    this.headers = options.headers;
  }

  createRequest(input: LlmProviderRequestInput): LlmProviderRequest {
    return omitUndefined({
      body: input.format.createRequestBody(input.request),
      headers: this.createHeaders(),
      method: "POST",
      signal: input.request.signal,
      url: joinUrlPath(this.baseUrl, resolveNanoGPTRequestPath(input.format)),
    });
  }

  private createHeaders(): Record<string, string> {
    if (this.authentication === "x-api-key") {
      return {
        "content-type": "application/json",
        ...this.headers,
        ...omitUndefined({ "x-api-key": this.apiKey }),
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
