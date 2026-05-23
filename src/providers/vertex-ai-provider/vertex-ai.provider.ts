import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { readGeminiGenerateContentModel } from "../utils/index";

export interface VertexAIProviderOptions {
  accessToken: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  location: string;
  projectId: string;
}

export class VertexAIProvider implements LlmProvider {
  readonly id = "vertex-ai";
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string> | undefined;
  private readonly location: string;
  private readonly projectId: string;

  constructor(options: VertexAIProviderOptions) {
    this.accessToken = options.accessToken;
    this.baseUrl = options.baseUrl ?? "https://aiplatform.googleapis.com/v1";
    this.headers = options.headers;
    this.location = options.location;
    this.projectId = options.projectId;
  }

  createRequest(input: LlmProviderRequestInput): LlmProviderRequest {
    return {
      body: input.format.createRequestBody(input.request),
      headers: {
        "content-type": "application/json",
        ...this.headers,
        authorization: `Bearer ${this.accessToken}`,
      },
      method: "POST",
      ...(input.request.signal === undefined ? {} : { signal: input.request.signal }),
      url: this.createUrl(input.format),
    };
  }

  private createUrl(format: LlmProviderRequestInput["format"]): string {
    const model = readGeminiGenerateContentModel(format, this.id);
    const normalizedBaseUrl = this.baseUrl.replace(/\/$/, "");

    return [
      normalizedBaseUrl,
      "projects",
      encodeURIComponent(this.projectId),
      "locations",
      encodeURIComponent(this.location),
      "publishers/google/models",
      `${encodeURIComponent(model)}:generateContent`,
    ].join("/");
  }
}
