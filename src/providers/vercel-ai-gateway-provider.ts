import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../core/provider";
import {
  createBearerHeaders,
  joinUrlPath,
  resolveOpenAICompatibleRequestPath,
} from "./utils/index";

export interface VercelAIGatewayProviderOptions {
  apiKey?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  providerOptions?: Record<string, unknown>;
}

export class VercelAIGatewayProvider implements LlmProvider {
  readonly id = "vercel-ai-gateway";
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string> | undefined;
  private readonly providerOptions: Record<string, unknown> | undefined;

  constructor(options: VercelAIGatewayProviderOptions = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? "https://ai-gateway.vercel.sh/v1";
    this.headers = options.headers;
    this.providerOptions = options.providerOptions;
  }

  createRequest(input: LlmProviderRequestInput): LlmProviderRequest {
    return {
      body: this.createBody(input.format.createRequestBody(input.request)),
      headers: createBearerHeaders({
        ...(this.apiKey === undefined ? {} : { apiKey: this.apiKey }),
        ...(this.headers === undefined ? {} : { headers: this.headers }),
      }),
      method: "POST",
      ...(input.request.signal === undefined ? {} : { signal: input.request.signal }),
      url: joinUrlPath(this.baseUrl, resolveOpenAICompatibleRequestPath(input.format)),
    };
  }

  private createBody(body: Record<string, unknown>): Record<string, unknown> {
    if (this.providerOptions === undefined) {
      return body;
    }

    return {
      ...body,
      providerOptions: this.providerOptions,
    };
  }
}
