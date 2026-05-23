import { LlmIoError } from "../core/errors";
import { isJsonObject, type JsonObject } from "../core/json";
import type { LlmProviderRequest, LlmProviderRequestInput } from "../core/provider";
import { GenericHttpProvider, type GenericHttpProviderOptions } from "./generic-http-provider";
import { resolveOpenAICompatibleRequestPath } from "./utils/index";

export type OpenAIServiceTier = "auto" | "default" | "flex" | "priority";

export interface OpenAIProviderOptions extends Omit<
  GenericHttpProviderOptions,
  "baseUrl" | "resolveRequestPath"
> {
  baseUrl?: string;
  serviceTier?: OpenAIServiceTier;
}

export class OpenAIProvider extends GenericHttpProvider {
  readonly id = "openai";
  private readonly serviceTier: OpenAIServiceTier | undefined;

  constructor(options: OpenAIProviderOptions = {}) {
    super({
      ...options,
      baseUrl: options.baseUrl ?? "https://api.openai.com/v1",
      resolveRequestPath: resolveOpenAICompatibleRequestPath,
    });

    this.serviceTier = options.serviceTier;
  }

  override createRequest(input: LlmProviderRequestInput): LlmProviderRequest {
    const providerRequest = super.createRequest(input);

    if (this.serviceTier === undefined) {
      return providerRequest;
    }

    return {
      ...providerRequest,
      body: this.createBody(providerRequest.body),
    };
  }

  private createBody(body: LlmProviderRequest["body"]): JsonObject {
    if (!isJsonObject(body)) {
      throw new LlmIoError("OpenAI provider requires a JSON object request body.");
    }

    if (body.service_tier !== undefined) {
      throw new LlmIoError("Use either OpenAIProvider.serviceTier or body.service_tier, not both.");
    }

    return {
      ...body,
      service_tier: this.serviceTier,
    };
  }
}
