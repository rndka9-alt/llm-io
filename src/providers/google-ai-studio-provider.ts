import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../core/provider";
import { createGeminiGenerateContentRequestPath, joinUrlPath } from "./utils/index";

export interface GoogleAIStudioProviderOptions {
  apiKey: string;
  baseUrl?: string;
  headers?: Record<string, string>;
}

export class GoogleAIStudioProvider implements LlmProvider {
  readonly id = "google-ai-studio";
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string> | undefined;

  constructor(options: GoogleAIStudioProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta";
    this.headers = options.headers;
  }

  createRequest(input: LlmProviderRequestInput): LlmProviderRequest {
    return {
      body: input.format.createRequestBody(input.request),
      headers: {
        "content-type": "application/json",
        ...this.headers,
      },
      method: "POST",
      ...(input.request.signal === undefined ? {} : { signal: input.request.signal }),
      url: appendApiKey(
        joinUrlPath(this.baseUrl, createGeminiGenerateContentRequestPath(input.format, this.id)),
        this.apiKey,
      ),
    };
  }
}

function appendApiKey(url: string, apiKey: string): string {
  const separator = url.includes("?") ? "&" : "?";

  return `${url}${separator}key=${encodeURIComponent(apiKey)}`;
}
