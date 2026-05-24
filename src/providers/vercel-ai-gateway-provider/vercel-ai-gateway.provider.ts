import type { JsonObject } from "../../types/json";
import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import { omitUndefined } from "../../utils/object";
import {
  createBearerHeaders,
  joinUrlPath,
  resolveOpenAICompatibleRequestPath,
} from "../utils/index";
import { throwUnsupportedFormat } from "../utils/throw-unsupported-format";

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
  /** provider별 timeout(ms)입니다. */
  byok?: { [providerId: string]: number | undefined };
}

export interface VercelAIGatewayByokCredentials extends JsonObject {
  /** provider별 BYOK credential입니다. */
  [providerId: string]: readonly JsonObject[] | undefined;
}

export interface VercelAIGatewayOptions extends JsonObject {
  /** Gateway BYOK credential입니다. */
  byok?: VercelAIGatewayByokCredentials;
  /** Gateway prompt caching 설정입니다. */
  caching?: "auto";
  /** Gateway model 후보입니다. */
  models?: readonly string[];
  /** 허용할 provider 목록입니다. */
  only?: readonly VercelAIGatewayProviderId[];
  /** provider 시도 순서입니다. */
  order?: readonly VercelAIGatewayProviderId[];
  /** provider별 timeout 설정입니다. */
  providerTimeouts?: VercelAIGatewayProviderTimeouts;
  /** Gateway tag 목록입니다. */
  tags?: readonly string[];
  /** 최종 사용자 식별자입니다. */
  user?: string;
  /** zero data retention 설정입니다. */
  zeroDataRetention?: boolean;
}

export type VercelAIGatewayReasoningEffort =
  /** 추론 없음 */
  | "none"
  /** 최소 추론 */
  | "minimal"
  /** 낮은 추론 */
  | "low"
  /** 기본 추론 */
  | "medium"
  /** 높은 추론 */
  | "high"
  /** 최대 추론 */
  | "xhigh";

export interface VercelAIGatewayOpenAIProviderOptions extends JsonObject {
  /** OpenAI reasoning effort입니다. */
  reasoningEffort?: VercelAIGatewayReasoningEffort;
  /** OpenAI structured output 설정입니다. */
  structuredOutputs?: boolean;
}

export interface VercelAIGatewayAnthropicProviderOptions extends JsonObject {
  /** Anthropic cache-control 설정입니다. */
  cacheControl?: boolean;
  /** Anthropic thinking 설정입니다. */
  thinking?: {
    /** thinking token 예산입니다. */
    budgetTokens?: number;
    /** thinking mode입니다. */
    type: "enabled";
  };
}

export interface VercelAIGatewayGoogleProviderOptions extends JsonObject {
  /** Google cachedContent입니다. */
  cachedContent?: string;
  /** Google safety settings입니다. */
  safetySettings?: readonly JsonObject[];
  /** Google thinking 설정입니다. */
  thinkingConfig?: {
    /** thought 포함 여부입니다. */
    includeThoughts?: boolean;
    /** thinking token 예산입니다. */
    thinkingBudget?: number;
  };
}

export interface VercelAIGatewayKnownProviderOptions extends JsonObject {
  /** Anthropic provider 옵션입니다. */
  anthropic?: VercelAIGatewayAnthropicProviderOptions;
  /** Google provider 옵션입니다. */
  google?: VercelAIGatewayGoogleProviderOptions;
  /** OpenAI provider 옵션입니다. */
  openai?: VercelAIGatewayOpenAIProviderOptions;
}

export type VercelAIGatewayProviderOptionsMap<
  TProviderSpecificOptions extends JsonObject = VercelAIGatewayKnownProviderOptions,
> = TProviderSpecificOptions & {
  gateway?: VercelAIGatewayOptions;
};

export interface VercelAIGatewayProviderOptions<
  TProviderOptions extends VercelAIGatewayProviderOptionsMap = VercelAIGatewayProviderOptionsMap,
> {
  /** Bearer 인증에 사용할 API key입니다. */
  apiKey?: string;
  /** 기본 Vercel AI Gateway endpoint를 바꿀 때 사용합니다. */
  baseUrl?: string;
  /** 요청에 추가할 header입니다. */
  headers?: Record<string, string>;
  /** Gateway와 provider별 옵션입니다. */
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
    return omitUndefined({
      body: this.createBody(input.format.createRequestBody(input.request)),
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

  private createBody(body: JsonObject): JsonObject {
    if (this.providerOptions === undefined) {
      return body;
    }

    return {
      ...body,
      providerOptions: this.providerOptions,
    };
  }

  private resolveRequestPath(format: LlmProviderRequestInput["format"]): string {
    if (format.id === "anthropic-messages") {
      return "/messages";
    }

    if (format.id === "openai-chat-completions" || format.id === "openai-responses") {
      return resolveOpenAICompatibleRequestPath(format);
    }

    throwUnsupportedFormat(this.id, format);
  }
}
