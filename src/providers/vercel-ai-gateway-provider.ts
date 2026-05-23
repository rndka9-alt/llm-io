import type { JsonObject } from "../core/json";
import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../core/provider";
import {
  createBearerHeaders,
  joinUrlPath,
  resolveOpenAICompatibleRequestPath,
} from "./utils/index";

export type VercelAIGatewayProviderId =
  | "alibaba"
  | "anthropic"
  | "arcee-ai"
  | "azure"
  | "baseten"
  | "bedrock"
  | "bfl"
  | "bytedance"
  | "cerebras"
  | "cohere"
  | "crusoe"
  | "deepinfra"
  | "deepseek"
  | "fireworks"
  | "google"
  | "groq"
  | "inception"
  | "klingai"
  | "meituan"
  | "minimax"
  | "mistral"
  | "moonshotai"
  | "morph"
  | "nebius"
  | "novita"
  | "openai"
  | "parasail"
  | "perplexity"
  | "prodia"
  | "recraft"
  | "sambanova"
  | "streamlake"
  | "togetherai"
  | "vercel"
  | "vertex"
  | "voyage"
  | "xai"
  | "zai"
  | (string & {});

export interface VercelAIGatewayProviderTimeouts extends JsonObject {
  byok?: { [providerId: string]: number | undefined };
}

export interface VercelAIGatewayByokCredentials extends JsonObject {
  [providerId: string]: readonly JsonObject[] | undefined;
}

export interface VercelAIGatewayOptions extends JsonObject {
  byok?: VercelAIGatewayByokCredentials;
  caching?: "auto";
  models?: readonly string[];
  only?: readonly VercelAIGatewayProviderId[];
  order?: readonly VercelAIGatewayProviderId[];
  providerTimeouts?: VercelAIGatewayProviderTimeouts;
  tags?: readonly string[];
  user?: string;
  zeroDataRetention?: boolean;
}

export type VercelAIGatewayProviderOptionsMap<
  TProviderSpecificOptions extends JsonObject = JsonObject,
> = TProviderSpecificOptions & {
  gateway?: VercelAIGatewayOptions;
};

export interface VercelAIGatewayProviderOptions<
  TProviderOptions extends VercelAIGatewayProviderOptionsMap = VercelAIGatewayProviderOptionsMap,
> {
  apiKey?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  providerOptions?: TProviderOptions;
}

export class VercelAIGatewayProvider<
  TProviderOptions extends VercelAIGatewayProviderOptionsMap = VercelAIGatewayProviderOptionsMap,
> implements LlmProvider {
  readonly id = "vercel-ai-gateway";
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string> | undefined;
  private readonly providerOptions: TProviderOptions | undefined;

  constructor(options: VercelAIGatewayProviderOptions<TProviderOptions> = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? "https://ai-gateway.vercel.sh/v1";
    this.headers = options.headers;
    this.providerOptions = options.providerOptions;
  }

  createRequest(input: LlmProviderRequestInput): LlmProviderRequest {
    return {
      body: this.createBody(input.format.createRequestBody(input.request)),
      headers: createBearerHeaders({
        ...(this.apiKey === undefined ? {} : { apiKey: this.apiKey }),
        ...(this.headers === undefined ? {} : { headers: this.headers }),
      }),
      method: "POST",
      ...(input.request.signal === undefined ? {} : { signal: input.request.signal }),
      url: joinUrlPath(this.baseUrl, resolveOpenAICompatibleRequestPath(input.format)),
    };
  }

  private createBody(body: JsonObject): JsonObject {
    if (this.providerOptions === undefined) {
      return body;
    }

    return {
      ...body,
      providerOptions: this.providerOptions,
    };
  }
}
