import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { omitUndefined } from "../../utils/object";
import { readGeminiGenerateContentModel, readProviderStream } from "../utils/index";

export interface VertexAIProviderOptions {
  /** Bearer 인증에 사용할 access token입니다. */
  accessToken: string;
  /** 기본 Vertex AI endpoint를 바꿀 때 사용합니다. */
  baseUrl?: string;
  /** 요청에 추가할 header입니다. */
  headers?: Record<string, string>;
  /** Vertex AI location입니다. */
  location: string;
  /** Google Cloud project id입니다. */
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
    return omitUndefined({
      body: input.format.createRequestBody(input.request),
      headers: {
        "content-type": "application/json",
        ...this.headers,
        authorization: `Bearer ${this.accessToken}`,
      },
      method: "POST",
      signal: input.request.signal,
      url: this.createUrl(input.format, "generateContent"),
    });
  }

  createStreamRequest(input: LlmProviderRequestInput): LlmProviderRequest {
    return {
      ...this.createRequest(input),
      url: this.createUrl(input.format, "streamGenerateContent"),
    };
  }

  readStream(
    body: ReadableStream<Uint8Array>,
    format: LlmProviderRequestInput["format"],
  ): AsyncIterable<unknown> {
    return readProviderStream(this.id, body, format);
  }

  private createUrl(
    format: LlmProviderRequestInput["format"],
    method: "generateContent" | "streamGenerateContent",
  ): string {
    const model = readGeminiGenerateContentModel(format, this.id);
    const normalizedBaseUrl = this.baseUrl.replace(/\/$/, "");

    return [
      normalizedBaseUrl,
      "projects",
      encodeURIComponent(this.projectId),
      "locations",
      encodeURIComponent(this.location),
      "publishers/google/models",
      `${encodeURIComponent(model)}:${method}`,
    ].join("/");
  }
}
