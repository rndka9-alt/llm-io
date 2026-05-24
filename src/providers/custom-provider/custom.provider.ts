import { LlmIoError } from "../../core/errors";
import type { JsonObject, JsonValue } from "../../types/json";
import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { omitUndefined } from "../../utils/object";
import { createBearerHeaders, joinUrlPath } from "../utils/index";
import { resolveCustomRequestPath } from "./utils/resolve-custom-request-path";

export interface CustomProviderBodyContext {
  /** format이 만든 기본 body입니다. */
  body: JsonObject;
  /** provider request 생성 입력입니다. */
  input: LlmProviderRequestInput;
}

export interface CustomProviderHeadersContext {
  /** 최종 body 후보입니다. */
  body: JsonValue;
  /** 기본 header입니다. */
  headers: Record<string, string>;
  /** provider request 생성 입력입니다. */
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
  /** Bearer 인증에 사용할 API key입니다. */
  apiKey?: string;
  /** 요청을 보낼 기본 URL입니다. */
  baseUrl: string;
  /** provider body를 직접 바꿀 때 사용합니다. */
  createBody?: CustomProviderBodyFactory;
  /** provider header를 직접 바꿀 때 사용합니다. */
  createHeaders?: CustomProviderHeadersFactory;
  /** 요청에 추가할 header입니다. */
  headers?: Record<string, string>;
  /** 고정 request path입니다. */
  requestPath?: string;
  /** format별 request path를 직접 정할 때 사용합니다. */
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

    return omitUndefined({
      body,
      headers: this.createHeaders(body, input),
      method: "POST",
      signal: input.request.signal,
      url: joinUrlPath(this.baseUrl, this.resolveRequestPath(input)),
    });
  }

  private createBody(body: JsonObject, input: LlmProviderRequestInput): JsonValue {
    if (this.createBodyOverride === undefined) {
      return body;
    }

    return this.createBodyOverride({ body, input });
  }

  private createHeaders(body: JsonValue, input: LlmProviderRequestInput): Record<string, string> {
    const headers = createBearerHeaders(
      omitUndefined({
        apiKey: this.apiKey,
        headers: this.headers,
      }),
    );

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
