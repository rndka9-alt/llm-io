import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { omitUndefined } from "../../utils/object";
import { createGeminiGenerateContentRequestPath, joinUrlPath } from "../utils/index";
import { appendApiKey } from "./utils/append-api-key";

export interface GoogleAIStudioProviderOptions {
  /** URL query에 넣을 API key입니다. */
  apiKey: string;
  /** 기본 Google AI Studio endpoint를 바꿀 때 사용합니다. */
  baseUrl?: string;
  /** 요청에 추가할 header입니다. */
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
    return omitUndefined({
      body: input.format.createRequestBody(input.request),
      headers: {
        "content-type": "application/json",
        ...this.headers,
      },
      method: "POST",
      signal: input.request.signal,
      url: appendApiKey(
        joinUrlPath(this.baseUrl, createGeminiGenerateContentRequestPath(input.format, this.id)),
        this.apiKey,
      ),
    });
  }
}
