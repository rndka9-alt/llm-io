import { LlmHttpError } from "./core/errors.js";
import type { LlmFormat } from "./core/format.js";
import type { LlmRequest } from "./core/message.js";
import type { LlmOutput } from "./core/output.js";
import type { LlmProvider } from "./core/provider.js";
import { GenericHttpProvider } from "./providers/generic-http-provider.js";
import type { FetchLike } from "./transport/fetch-like.js";

export type LlmOptions<TRaw, TExtras = undefined> =
  | LlmProviderOptions<TRaw, TExtras>
  | LlmLegacyHttpOptions<TRaw, TExtras>;

export interface LlmProviderOptions<TRaw, TExtras = undefined> {
  fetch?: FetchLike;
  format: LlmFormat<TRaw, TExtras>;
  provider: LlmProvider;
}

export interface LlmLegacyHttpOptions<TRaw, TExtras = undefined> {
  apiKey?: string;
  baseUrl: string;
  fetch?: FetchLike;
  format: LlmFormat<TRaw, TExtras>;
  headers?: Record<string, string>;
}

export class Llm<TRaw, TExtras = undefined> {
  private readonly fetchImplementation: FetchLike;
  private readonly format: LlmFormat<TRaw, TExtras>;
  private readonly provider: LlmProvider;

  constructor(options: LlmOptions<TRaw, TExtras>) {
    this.fetchImplementation = options.fetch ?? fetch;
    this.format = options.format;
    this.provider = createProvider(options);
  }

  async generate(request: LlmRequest): Promise<LlmOutput<TRaw, TExtras>> {
    const providerRequest = await this.provider.createRequest({
      body: this.format.createRequestBody(request),
      ...(this.format.requestPath === undefined ? {} : { requestPath: this.format.requestPath }),
      ...(request.signal === undefined ? {} : { signal: request.signal }),
    });

    const response = await this.fetchImplementation(providerRequest.url, {
      body: JSON.stringify(providerRequest.body),
      headers: providerRequest.headers,
      method: providerRequest.method,
      ...(providerRequest.signal === undefined ? {} : { signal: providerRequest.signal }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new LlmHttpError(response.status, responseText);
    }

    const responseJson = JSON.parse(responseText);

    return this.format.parseResponse(responseJson);
  }
}

export type HttpLlmContainerOptions<TRaw, TExtras = undefined> = LlmOptions<TRaw, TExtras>;
export const HttpLlmContainer = Llm;

function createProvider<TRaw, TExtras>(options: LlmOptions<TRaw, TExtras>): LlmProvider {
  if ("provider" in options) {
    return options.provider;
  }

  return new GenericHttpProvider({
    baseUrl: options.baseUrl,
    ...(options.apiKey === undefined ? {} : { apiKey: options.apiKey }),
    ...(options.headers === undefined ? {} : { headers: options.headers }),
  });
}
