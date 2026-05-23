import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { createBearerHeaders, joinUrlPath } from "../utils/index";
import { resolveNanoGPTRequestPath } from "./utils/resolve-nanogpt-request-path";

export type NanoGPTAuthentication = "bearer" | "x-api-key";

export interface NanoGPTProviderOptions {
  apiKey?: string;
  authentication?: NanoGPTAuthentication;
  baseUrl?: string;
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
    return {
      body: input.format.createRequestBody(input.request),
      headers: this.createHeaders(),
      method: "POST",
      ...(input.request.signal === undefined ? {} : { signal: input.request.signal }),
      url: joinUrlPath(this.baseUrl, resolveNanoGPTRequestPath(input.format)),
    };
  }

  private createHeaders(): Record<string, string> {
    if (this.authentication === "x-api-key") {
      return {
        "content-type": "application/json",
        ...this.headers,
        ...(this.apiKey === undefined ? {} : { "x-api-key": this.apiKey }),
      };
    }

    return createBearerHeaders({
      ...(this.apiKey === undefined ? {} : { apiKey: this.apiKey }),
      ...(this.headers === undefined ? {} : { headers: this.headers }),
    });
  }
}
