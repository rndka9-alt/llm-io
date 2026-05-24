import type { JsonObject, JsonSchemaObject } from "../../core/json";

export type OpenAIChatCompletionsReasoningEffort =
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

/** 프롬프트 캐시를 유지할 기간이다. */
export type OpenAIChatCompletionsPromptCacheRetention = "in_memory" | "24h";

export type OpenAIChatCompletionsServiceTier =
  /** 프로젝트 기본 설정에 따라 처리 계층을 자동 선택한다. */
  | "auto"
  /** 기본 처리 계층을 사용한다. */
  | "default"
  /** 지연 시간보다 비용 효율을 우선하는 flex 계층을 사용한다. */
  | "flex"
  /** 낮은 지연 시간을 우선하는 priority 계층을 사용한다. */
  | "priority"
  /** Scale Tier 크레딧을 사용하도록 요청한다. */
  | "scale";

export type OpenAIChatCompletionsVerbosity =
  /** 더 짧고 간결한 답변을 유도한다. */
  | "low"
  /** 모델 기본에 가까운 답변 길이를 사용한다. */
  | "medium"
  /** 더 자세한 답변을 유도한다. */
  | "high";

export type OpenAIChatCompletionsModality =
  /** 텍스트 출력을 요청한다. */
  | "text"
  /** 오디오 출력을 요청한다. */
  | "audio";

export type OpenAIChatCompletionsAudioFormat =
  /** WAV 컨테이너 오디오를 반환한다. */
  | "wav"
  /** MP3 압축 오디오를 반환한다. */
  | "mp3"
  /** FLAC 무손실 오디오를 반환한다. */
  | "flac"
  /** Opus 압축 오디오를 반환한다. */
  | "opus"
  /** 16-bit PCM 원시 오디오를 반환한다. */
  | "pcm16";

export type OpenAIChatCompletionsAudioVoice =
  /** 중립적인 기본 음성이다. */
  | "alloy"
  /** 낮고 차분한 톤의 음성이다. */
  | "ash"
  /** 부드럽고 표현적인 톤의 음성이다. */
  | "ballad"
  /** 밝고 선명한 톤의 음성이다. */
  | "coral"
  /** 명료하고 균형 잡힌 톤의 음성이다. */
  | "echo"
  /** 이야기 전달에 어울리는 톤의 음성이다. */
  | "fable"
  /** 활기 있고 친근한 톤의 음성이다. */
  | "nova"
  /** 깊고 안정적인 톤의 음성이다. */
  | "onyx"
  /** 차분하고 지적인 톤의 음성이다. */
  | "sage"
  /** 밝고 가벼운 톤의 음성이다. */
  | "shimmer"
  /** 자연스럽고 표현적인 톤의 음성이다. */
  | "verse"
  /** 고품질 음성 출력에 권장되는 음성이다. */
  | "marin"
  /** 고품질 음성 출력에 권장되는 음성이다. */
  | "cedar";

export type OpenAIChatCompletionsToolChoice =
  /** 도구 호출을 금지한다. */
  | "none"
  /** 모델이 도구 호출 여부를 결정한다. */
  | "auto"
  /** 모델이 하나 이상의 도구를 호출하도록 강제한다. */
  | "required"
  /** 특정 함수 도구를 호출하도록 강제한다. */
  | OpenAIChatCompletionsNamedToolChoice;

export type OpenRouterDataCollection =
  /** provider가 요청 데이터를 수집할 수 있게 허용한다. */
  | "allow"
  /** 데이터 수집을 허용하지 않는 provider로 제한한다. */
  | "deny";

/** NanoGPT reasoning delta를 OpenAI-compatible chunk의 reasoning_content 필드로 보낸다. */
export type NanoGPTReasoningDeltaField = "reasoning_content";

export type NanoGPTReasoningEffort =
  /** NanoGPT reasoning을 요청하지 않는다. */
  | "none"
  /** 가능한 가장 적은 reasoning으로 응답 지연과 비용을 줄인다. */
  | "minimal"
  /** 낮은 reasoning 예산으로 빠른 응답을 우선한다. */
  | "low"
  /** 일반적인 reasoning 예산을 사용한다. */
  | "medium"
  /** 더 어려운 작업을 위해 높은 reasoning 예산을 사용한다. */
  | "high"
  /** 지원 모델에서 가장 높은 reasoning 예산을 요청한다. */
  | "xhigh";

export interface OpenAIChatCompletionsAudioOptions extends JsonObject {
  /** 반환할 오디오 파일 형식이다. */
  format: OpenAIChatCompletionsAudioFormat;
  /** 오디오 응답에 사용할 음성이다. */
  voice: OpenAIChatCompletionsAudioVoice | { id: string };
}

export interface OpenAIChatCompletionsFunctionToolChoice extends JsonObject {
  /** 호출할 함수 도구 이름이다. */
  name: string;
}

export interface OpenAIChatCompletionsNamedToolChoice extends JsonObject {
  /** 강제로 호출할 함수 도구 정보다. */
  function: OpenAIChatCompletionsFunctionToolChoice;
  /** tool_choice가 함수 도구를 가리킨다는 표시다. */
  type: "function";
}

export interface OpenAIChatCompletionsFunctionToolDefinition extends JsonObject {
  /** 모델이 tool 사용 시 참고할 설명이다. */
  description?: string;
  /** 모델이 호출할 함수 이름이다. */
  name: string;
  /** 함수 인자의 JSON Schema object다. */
  parameters?: JsonSchemaObject;
  /** 지원 모델에서 schema 엄격 준수를 요청한다. */
  strict?: boolean;
}

export interface OpenAIChatCompletionsFunctionTool extends JsonObject {
  /** 함수 도구 정의다. */
  function: OpenAIChatCompletionsFunctionToolDefinition;
  /** OpenAI tool type 식별자다. */
  type: "function";
}

export type OpenAIChatCompletionsTool = OpenAIChatCompletionsFunctionTool;

export interface OpenAIChatCompletionsStreamOptions extends JsonObject {
  /** streaming delta에 obfuscation 필드를 포함할지 결정한다. */
  include_obfuscation?: boolean;
  /** 스트림 마지막 chunk에 token usage 정보를 포함할지 결정한다. */
  include_usage?: boolean;
}

export interface OpenAIChatCompletionsTextResponseFormat extends JsonObject {
  /** 일반 텍스트 응답을 요청한다. */
  type: "text";
}

export interface OpenAIChatCompletionsJsonObjectResponseFormat extends JsonObject {
  /** JSON object 모드 응답을 요청한다. */
  type: "json_object";
}

export interface OpenAIChatCompletionsJsonSchemaDefinition extends JsonObject {
  /** schema 목적을 설명하는 문장이다. */
  description?: string;
  /** 응답 schema 이름이다. */
  name: string;
  /** 모델이 맞춰야 하는 JSON Schema다. */
  schema: JsonSchemaObject;
  /** 지원 모델에서 schema 엄격 준수를 요청한다. */
  strict?: boolean;
}

export interface OpenAIChatCompletionsJsonSchemaResponseFormat extends JsonObject {
  /** 구조화 출력에 사용할 JSON Schema 정의다. */
  json_schema: OpenAIChatCompletionsJsonSchemaDefinition;
  /** JSON Schema 기반 구조화 출력을 요청한다. */
  type: "json_schema";
}

export type OpenAIChatCompletionsResponseFormat =
  | OpenAIChatCompletionsTextResponseFormat
  | OpenAIChatCompletionsJsonObjectResponseFormat
  | OpenAIChatCompletionsJsonSchemaResponseFormat;

export interface OpenRouterProviderRouting extends JsonObject {
  /** 선택한 provider 실패 시 다른 provider로 fallback할지 결정한다. */
  allow_fallbacks?: boolean;
  /** 데이터 수집 정책에 맞는 provider만 사용하도록 제한한다. */
  data_collection?: OpenRouterDataCollection;
  /** 라우팅 후보에서 제외할 provider id 목록이다. */
  ignore?: readonly string[];
  /** 우선 시도할 provider id 순서다. */
  order?: readonly string[];
  /** 허용할 양자화 방식 목록이다. */
  quantizations?: readonly string[];
  /** 요청 파라미터를 모두 지원하는 provider만 사용하도록 제한한다. */
  require_parameters?: boolean;
  /** zero data retention provider만 사용하도록 제한한다. */
  zdr?: boolean;
  /** distillable text가 허용되는 모델로 제한한다. */
  enforce_distillable_text?: boolean;
  /** 라우팅 후보로 허용할 provider id 목록이다. */
  only?: readonly string[];
  /** provider 선택 시 우선할 정렬 기준이다. */
  sort?: OpenRouterProviderSort;
  /** 선호하는 최소 처리량 조건이다. */
  preferred_min_throughput?: OpenRouterProviderPerformancePreference;
  /** 선호하는 최대 지연 시간 조건이다. */
  preferred_max_latency?: OpenRouterProviderPerformancePreference;
  /** 요청에 허용할 최대 가격 조건이다. */
  max_price?: OpenRouterProviderMaxPrice;
}

export type OpenRouterProviderSortKey = "price" | "throughput" | "latency";

export interface OpenRouterProviderSortOptions extends JsonObject {
  /** provider 정렬 기준이다. */
  by: OpenRouterProviderSortKey;
  /** 여러 모델 fallback 시 정렬 그룹 기준이다. */
  partition?: "model" | "none";
}

export type OpenRouterProviderSort = OpenRouterProviderSortKey | OpenRouterProviderSortOptions;

export interface OpenRouterProviderPercentilePreference extends JsonObject {
  p50?: number;
  p75?: number;
  p90?: number;
  p99?: number;
}

export type OpenRouterProviderPerformancePreference =
  | number
  | OpenRouterProviderPercentilePreference;

export interface OpenRouterProviderMaxPrice extends JsonObject {
  prompt?: number;
  completion?: number;
  request?: number;
  image?: number;
}

export interface NanoGPTCacheControl extends JsonObject {
  /** 이 메시지/프롬프트 조각을 임시 캐시 대상으로 표시한다. */
  type: "ephemeral";
  /** 임시 캐시 유지 시간이다. */
  ttl?: "5m" | "1h";
}

export interface NanoGPTPromptCachingOptions extends JsonObject {
  /** Anthropic-style cache_control을 NanoGPT 요청에 전달한다. */
  cache_control?: NanoGPTCacheControl;
  /** 지정한 메시지 인덱스 이후를 캐싱 후보에서 제외한다. */
  cut_after_message_index?: number;
  /** 프롬프트 캐시 유지 시간이다. */
  ttl?: "5m" | "1h";
}

export interface NanoGPTReasoningOptions extends JsonObject {
  /** 스트리밍 reasoning delta를 담을 필드명이다. */
  delta_field?: NanoGPTReasoningDeltaField;
  /** NanoGPT provider에 요청할 추론 강도다. */
  effort?: NanoGPTReasoningEffort;
  /** reasoning content를 최종 응답에서 제외하도록 요청한다. */
  exclude?: boolean;
}

export interface OpenAIChatCompletionsExtraBody {
  /** 오디오 출력 형식과 음성을 설정한다. */
  audio?: OpenAIChatCompletionsAudioOptions | null;
  /** provider가 지원하는 prompt caching을 켜거나 끈다. */
  caching?: boolean;
  /** 같은 토큰 반복을 줄이기 위한 빈도 기반 penalty다. */
  frequency_penalty?: number | null;
  /** 특정 token id의 선택 가능성을 조정한다. */
  logit_bias?: JsonObject | null;
  /** 출력 token log probability 반환 여부 또는 개수다. */
  logprobs?: boolean | number | null;
  /** 생성 completion에 사용할 최대 token 수다. */
  max_completion_tokens?: number | null;
  /** provider/API에서 추적할 사용자 정의 metadata다. */
  metadata?: JsonObject | null;
  /** 요청할 출력 modality 목록이다. */
  modalities?: readonly OpenAIChatCompletionsModality[] | null;
  /** 생성할 후보 응답 개수다. */
  n?: number | null;
  /** 여러 tool call을 병렬로 허용할지 결정한다. */
  parallel_tool_calls?: boolean;
  /** 예측 가능한 출력 일부를 제공해 latency를 줄이는 힌트다. */
  prediction?: JsonObject;
  /** OpenAI prompt cache를 공유할 키다. */
  prompt_cache_key?: string;
  /** OpenAI prompt cache retention 정책이다. */
  prompt_cache_retention?: OpenAIChatCompletionsPromptCacheRetention;
  /** NanoGPT prompt caching 옵션이다. */
  prompt_caching?: NanoGPTPromptCachingOptions;
  /** prompt token log probability 반환을 요청한다. */
  prompt_logprobs?: boolean;
  /** OpenRouter provider routing 옵션이다. */
  provider?: OpenRouterProviderRouting;
  /** NanoGPT reasoning 옵션이다. */
  reasoning?: NanoGPTReasoningOptions;
  /** reasoning_content 호환 필드 출력을 요청한다. */
  reasoning_content_compat?: boolean;
  /** NanoGPT streaming reasoning delta 필드명이다. */
  reasoning_delta_field?: NanoGPTReasoningDeltaField;
  /** OpenAI-compatible reasoning 모델의 추론 강도다. */
  reasoning_effort?: OpenAIChatCompletionsReasoningEffort;
  /** 텍스트, JSON object, JSON schema 응답 형식을 지정한다. */
  response_format?: OpenAIChatCompletionsResponseFormat;
  /** abuse monitoring에 사용할 최종 사용자 식별자다. */
  safety_identifier?: string;
  /** NanoGPT web scraping 사용 여부 또는 상세 옵션이다. */
  scraping?: boolean | JsonObject;
  /** 가능한 경우 deterministic sampling을 위한 seed다. */
  seed?: number | null;
  /** OpenAI 처리 계층을 지정한다. */
  service_tier?: OpenAIChatCompletionsServiceTier | null;
  /** 생성 중단 문자열이다. */
  stop?: string | readonly string[] | null;
  /** provider가 응답을 저장할지 결정한다. */
  store?: boolean | null;
  /** streaming 응답을 요청한다. 현재 Llm.generate는 JSON 응답만 처리한다. */
  stream?: boolean | null;
  /** streaming 응답의 부가 정보를 제어한다. */
  stream_options?: OpenAIChatCompletionsStreamOptions | null;
  /** tail free sampling 값이다. */
  tfs?: number;
  /** tool 호출 정책을 지정한다. */
  tool_choice?: OpenAIChatCompletionsToolChoice;
  /** 모델이 호출할 수 있는 도구 목록이다. */
  tools?: readonly OpenAIChatCompletionsTool[];
  /** sampling 후보 token 수를 제한한다. */
  top_k?: number;
  /** 반환할 상위 token log probability 개수다. */
  top_logprobs?: number | null;
  /** OpenRouter prompt transform 목록이다. */
  transforms?: readonly "middle-out"[];
  /** typical sampling 확률 값이다. */
  typical_p?: number;
  /** provider/API에 전달할 최종 사용자 식별자다. */
  user?: string;
  /** 지원 모델에서 답변 자세함을 조정한다. */
  verbosity?: OpenAIChatCompletionsVerbosity;
  /** web search tool 동작 옵션이다. */
  web_search_options?: JsonObject;
}
