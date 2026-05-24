import type { LlmFormat } from "../../core/format";
import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { omitUndefined } from "../../utils/object";
import { createBearerHeaders, joinUrlPath } from "../utils/index";
import { resolveGenericRequestPath } from "./utils/resolve-generic-request-path";

export interface GenericHttpProviderOptions {
  apiKey?: string;
  baseUrl: string;
  headers?: Record<string, string>;
  resolveRequestPath?: (format: LlmFormat<unknown, unknown>) => string | undefined;
}

export class GenericHttpProvider implements LlmProvider {
  readonly id: string = "generic-http";
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string> | undefined;
  private readonly resolveRequestPath: (format: LlmFormat<unknown, unknown>) => string | undefined;

  constructor(options: GenericHttpProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl;
    this.headers = options.headers;
    this.resolveRequestPath = options.resolveRequestPath ?? resolveGenericRequestPath;
  }

  createRequest(input: LlmProviderRequestInput): LlmProviderRequest {
    return omitUndefined({
      body: input.format.createRequestBody(input.request),
      headers: createBearerHeaders(
        omitUndefined({
          apiKey: this.apiKey,
          headers: this.headers,
        }),
      ),
      method: "POST",
      signal: input.request.signal,
      url: joinUrlPath(this.baseUrl, this.resolveRequestPath(input.format)),
    });
  }
}
