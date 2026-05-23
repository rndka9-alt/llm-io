import { LlmHttpError } from "../core/errors";
import type { LlmFormat } from "../core/format";
import type { LlmRequest } from "../core/message";
import type { LlmOutput } from "../core/output";
import type { LlmProvider } from "../core/provider";
import type { FetchLike } from "../transport/fetch-like";
import { createProvider } from "./create-provider";
import type { LlmOptions } from "./types";

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
      format: this.format,
      request,
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

export const HttpLlmContainer = Llm;
