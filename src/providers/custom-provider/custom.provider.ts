import { LlmIoError } from "../../core/errors";
import type { JsonObject, JsonValue } from "../../core/json";
import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { createBearerHeaders, joinUrlPath } from "../utils/index";
import { resolveCustomRequestPath } from "./utils/resolve-custom-request-path";

export interface CustomProviderBodyContext {
  body: JsonObject;
  input: LlmProviderRequestInput;
}

export interface CustomProviderHeadersContext {
  body: JsonValue;
  headers: Record<string, string>;
  input: LlmProviderRequestInput;
}

export type CustomProviderBodyFactory = (context: CustomProviderBodyContext) => JsonValue;
export type CustomProviderHeadersFactory = (
  context: CustomProviderHeadersContext,
) => Record<string, string>;
export type CustomProviderRequestPathResolver = (
  input: LlmProviderRequestInput,
) => string | undefined;

export interface CustomProviderOptions {
  apiKey?: string;
  baseUrl: string;
  createBody?: CustomProviderBodyFactory;
  createHeaders?: CustomProviderHeadersFactory;
  headers?: Record<string, string>;
  requestPath?: string;
  resolveRequestPath?: CustomProviderRequestPathResolver;
}

export class CustomProvider implements LlmProvider {
  readonly id = "custom";
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly createBodyOverride: CustomProviderBodyFactory | undefined;
  private readonly createHeadersOverride: CustomProviderHeadersFactory | undefined;
  private readonly headers: Record<string, string> | undefined;
  private readonly requestPath: string | undefined;
  private readonly resolveRequestPathOverride: CustomProviderRequestPathResolver | undefined;

  constructor(options: CustomProviderOptions) {
    if (options.requestPath !== undefined && options.resolveRequestPath !== undefined) {
      throw new LlmIoError(
        "Use either CustomProvider.requestPath or resolveRequestPath, not both.",
      );
    }

    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl;
    this.createBodyOverride = options.createBody;
    this.createHeadersOverride = options.createHeaders;
    this.headers = options.headers;
    this.requestPath = options.requestPath;
    this.resolveRequestPathOverride = options.resolveRequestPath;
  }

  createRequest(input: LlmProviderRequestInput): LlmProviderRequest {
    const baseBody = input.format.createRequestBody(input.request);
    const body = this.createBody(baseBody, input);

    return {
      body,
      headers: this.createHeaders(body, input),
      method: "POST",
      ...(input.request.signal === undefined ? {} : { signal: input.request.signal }),
      url: joinUrlPath(this.baseUrl, this.resolveRequestPath(input)),
    };
  }

  private createBody(body: JsonObject, input: LlmProviderRequestInput): JsonValue {
    if (this.createBodyOverride === undefined) {
      return body;
    }

    return this.createBodyOverride({ body, input });
  }

  private createHeaders(body: JsonValue, input: LlmProviderRequestInput): Record<string, string> {
    const headers = createBearerHeaders({
      ...(this.apiKey === undefined ? {} : { apiKey: this.apiKey }),
      ...(this.headers === undefined ? {} : { headers: this.headers }),
    });

    if (this.createHeadersOverride === undefined) {
      return headers;
    }

    return this.createHeadersOverride({ body, headers, input });
  }

  private resolveRequestPath(input: LlmProviderRequestInput): string | undefined {
    if (this.requestPath !== undefined) {
      return this.requestPath;
    }

    if (this.resolveRequestPathOverride !== undefined) {
      return this.resolveRequestPathOverride(input);
    }

    return resolveCustomRequestPath(input.format);
  }
}
