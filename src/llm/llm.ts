import { LlmHttpError, LlmIoError } from "../core/errors";
import type { LlmFormat } from "../core/format";
import type { LlmRequest } from "../core/message";
import type { LlmOutput } from "../core/output";
import type { LlmProvider } from "../core/provider";
import type { LlmStreamEvent } from "../core/stream";
import type { FetchLike } from "../transport/fetch-like";
import { omitUndefined } from "../utils/object";
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

    const response = await this.fetchImplementation(
      providerRequest.url,
      omitUndefined({
        body: JSON.stringify(providerRequest.body),
        headers: providerRequest.headers,
        method: providerRequest.method,
        signal: providerRequest.signal,
      }),
    );

    const responseText = await response.text();

    if (!response.ok) {
      throw new LlmHttpError(response.status, responseText);
    }

    const responseJson = JSON.parse(responseText);

    return this.format.parseResponse(responseJson);
  }

  /** 정규화된 event stream을 반환합니다. */
  stream(request: LlmRequest): ReadableStream<LlmStreamEvent> {
    const events = this.createStreamEvents(request);

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const event of events) {
            controller.enqueue(event);
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }

  /** text delta만 반환합니다. raw stream이 아닙니다. */
  streamText(request: LlmRequest): ReadableStream<string> {
    const events = this.stream(request);

    return new ReadableStream({
      async start(controller) {
        const reader = events.getReader();

        try {
          while (true) {
            const result = await reader.read();

            if (result.done) {
              break;
            }

            if (result.value.type === "text-delta") {
              controller.enqueue(result.value.text);
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });
  }

  private async *createStreamEvents(request: LlmRequest): AsyncIterable<LlmStreamEvent> {
    if (this.format.parseStream === undefined) {
      throw new LlmIoError(`${this.format.id} does not support streaming.`);
    }

    if (this.provider.createStreamRequest === undefined || this.provider.readStream === undefined) {
      throw new LlmIoError(`${this.provider.id} does not support streaming.`);
    }

    const providerRequest = await this.provider.createStreamRequest({
      format: this.format,
      request,
    });

    const response = await this.fetchImplementation(
      providerRequest.url,
      omitUndefined({
        body: JSON.stringify(providerRequest.body),
        headers: providerRequest.headers,
        method: providerRequest.method,
        signal: providerRequest.signal,
      }),
    );

    if (!response.ok) {
      throw new LlmHttpError(response.status, await response.text());
    }

    if (response.body === undefined || response.body === null) {
      throw new LlmIoError("Streaming response body is empty.");
    }

    yield* this.format.parseStream(this.provider.readStream(response.body, this.format));
  }
}

export const HttpLlmContainer = Llm;
