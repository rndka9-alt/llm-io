import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../core/provider.js";
import { joinUrlPath } from "./utils.js";

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
      body: input.body,
      headers: {
        "content-type": "application/json",
        ...this.headers,
        authorization: `Bearer ${this.accessToken}`,
      },
      method: "POST",
      ...(input.signal === undefined ? {} : { signal: input.signal }),
      url: this.createUrl(input.requestPath),
    };
  }

  private createUrl(requestPath: string | undefined): string {
    return joinUrlPath(
      this.baseUrl,
      [
        "projects",
        encodeURIComponent(this.projectId),
        "locations",
        encodeURIComponent(this.location),
        "publishers/google",
        requestPath?.replace(/^\//, ""),
      ]
        .filter((pathPart): pathPart is string => pathPart !== undefined && pathPart.length > 0)
        .join("/"),
    );
  }
}
