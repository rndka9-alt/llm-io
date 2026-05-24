import type { JsonObject } from "../../types/json";
import type { LlmProvider, LlmProviderRequest, LlmProviderRequestInput } from "../../core/provider";
import {
  createBearerHeaders,
  joinUrlPath,
  resolveOpenAICompatibleRequestPath,
} from "../utils/index";

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
  /** BYOK provider별 timeout(ms) 설정이다. */
  byok?: { [providerId: string]: number | undefined };
}

export interface VercelAIGatewayByokCredentials extends JsonObject {
  /** provider id별 Bring Your Own Key credential 목록이다. */
  [providerId: string]: readonly JsonObject[] | undefined;
}

export interface VercelAIGatewayOptions extends JsonObject {
  /** Vercel AI Gateway에 전달할 provider별 BYOK credential이다. */
  byok?: VercelAIGatewayByokCredentials;
  /** Gateway prompt caching을 자동으로 사용하도록 요청한다. */
  caching?: "auto";
  /** Gateway가 선택할 수 있는 model id 후보 목록이다. */
  models?: readonly string[];
  /** 지정한 provider만 사용하도록 제한한다. */
  only?: readonly VercelAIGatewayProviderId[];
  /** provider 시도 순서다. */
  order?: readonly VercelAIGatewayProviderId[];
  /** provider별 timeout 설정이다. */
  providerTimeouts?: VercelAIGatewayProviderTimeouts;
  /** Gateway analytics나 tracing에 붙일 tag 목록이다. */
  tags?: readonly string[];
  /** Gateway에 전달할 최종 사용자 식별자다. */
  user?: string;
  /** zero data retention 경로를 요청한다. */
  zeroDataRetention?: boolean;
}

export type VercelAIGatewayReasoningEffort =
  /** 추론 토큰을 쓰지 않도록 요청한다. */
  | "none"
  /** 가능한 가장 적은 추론으로 응답 지연과 비용을 줄인다. */
  | "minimal"
  /** 낮은 추론 예산으로 빠른 응답을 우선한다. */
  | "low"
  /** 일반적인 추론 예산을 사용한다. */
  | "medium"
  /** 더 어려운 작업을 위해 높은 추론 예산을 사용한다. */
  | "high"
  /** 지원 모델에서 가장 높은 추론 예산을 요청한다. */
  | "xhigh";

export interface VercelAIGatewayOpenAIProviderOptions extends JsonObject {
  /** OpenAI provider에 전달할 reasoning effort다. */
  reasoningEffort?: VercelAIGatewayReasoningEffort;
  /** OpenAI structured output 지원 경로를 요청한다. */
  structuredOutputs?: boolean;
}

export interface VercelAIGatewayAnthropicProviderOptions extends JsonObject {
  /** Anthropic provider에 cache-control 자동 처리를 요청한다. */
  cacheControl?: boolean;
  /** Anthropic extended thinking 설정이다. */
  thinking?: {
    /** extended thinking에 배정할 token 예산이다. */
    budgetTokens?: number;
    /** extended thinking을 켠다. */
    type: "enabled";
  };
}

export interface VercelAIGatewayGoogleProviderOptions extends JsonObject {
  /** Google provider에 전달할 cachedContent 리소스 이름이다. */
  cachedContent?: string;
  /** Google provider에 전달할 safety setting 목록이다. */
  safetySettings?: readonly JsonObject[];
  /** Google provider에 전달할 thinking 설정이다. */
  thinkingConfig?: {
    /** reasoning/thought 내용을 응답 part에 포함할지 결정한다. */
    includeThoughts?: boolean;
    /** 모델 thinking에 사용할 token 예산이다. */
    thinkingBudget?: number;
  };
}

export interface VercelAIGatewayKnownProviderOptions extends JsonObject {
  /** Anthropic provider-specific 옵션이다. */
  anthropic?: VercelAIGatewayAnthropicProviderOptions;
  /** Google provider-specific 옵션이다. */
  google?: VercelAIGatewayGoogleProviderOptions;
  /** OpenAI provider-specific 옵션이다. */
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
