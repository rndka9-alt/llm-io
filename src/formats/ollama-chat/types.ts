import type { JsonObject, JsonSchemaObject } from "../../core/json";

export type OllamaThink =
  /** thinking 출력을 켜거나 끈다. */
  | boolean
  /** 낮은 thinking 강도를 요청한다. */
  | "low"
  /** 중간 thinking 강도를 요청한다. */
  | "medium"
  /** 높은 thinking 강도를 요청한다. */
  | "high";

/** 모델을 메모리에 유지할 시간 또는 초 단위 값이다. */
export type OllamaKeepAlive = string | number;

export type OllamaFormat =
  /** JSON mode 응답을 요청한다. */
  | "json"
  /** structured output용 JSON Schema를 전달한다. */
  | JsonObject;

export interface OllamaChatModelOptions extends JsonObject {
  /** 같은 token 반복을 줄이기 위한 빈도 기반 penalty다. */
  frequency_penalty?: number;
  /** Mirostat sampling 모드다. */
  mirostat?: number;
  /** Mirostat learning rate다. */
  mirostat_eta?: number;
  /** Mirostat 목표 entropy다. */
  mirostat_tau?: number;
  /** prompt 처리 batch 크기다. */
  num_batch?: number;
  /** context window token 수다. */
  num_ctx?: number;
  /** 사용할 GPU layer 수다. */
  num_gpu?: number;
  /** context에서 유지할 초기 token 수다. */
  num_keep?: number;
  /** 생성할 최대 token 수다. */
  num_predict?: number;
  /** CPU thread 수다. */
  num_thread?: number;
  /** 이미 나온 주제 반복을 줄이기 위한 presence penalty다. */
  presence_penalty?: number;
  /** 반복 penalty를 적용할 최근 token 범위다. */
  repeat_last_n?: number;
  /** 반복 token에 적용할 penalty다. */
  repeat_penalty?: number;
  /** 가능한 경우 deterministic sampling을 위한 seed다. */
  seed?: number;
  /** 생성 중단 문자열이다. */
  stop?: string | readonly string[];
  /** sampling 무작위성이다. */
  temperature?: number;
  /** tail free sampling 값이다. */
  tfs_z?: number;
  /** sampling 후보 token 수를 제한한다. */
  top_k?: number;
  /** nucleus sampling 확률 값이다. */
  top_p?: number;
  /** typical sampling 확률 값이다. */
  typical_p?: number;
}

export interface OllamaFunctionToolDefinition extends JsonObject {
  /** 모델이 tool 사용 시 참고할 설명이다. */
  description?: string;
  /** 모델이 호출할 함수 이름이다. */
  name: string;
  /** 함수 인자의 JSON Schema object다. */
  parameters: JsonSchemaObject;
}

export interface OllamaFunctionTool extends JsonObject {
  /** 함수 도구 정의다. */
  function: OllamaFunctionToolDefinition;
  /** Ollama tool type 식별자다. */
  type: "function";
}

export type OllamaTool = OllamaFunctionTool;

export interface OllamaChatExtraBody {
  /** JSON mode 또는 JSON Schema structured output 설정이다. */
  format?: OllamaFormat;
  /** 요청 후 모델을 메모리에 유지할 시간이다. */
  keep_alive?: OllamaKeepAlive;
  /** token log probability 반환 여부다. */
  logprobs?: boolean;
  /** Ollama model runtime option이다. */
  options?: OllamaChatModelOptions;
  /** streaming 응답을 요청한다. 현재 Llm.generate는 JSON 응답만 처리한다. */
  stream?: boolean;
  /** thinking 출력 또는 thinking 강도를 요청한다. */
  think?: OllamaThink;
  /** 모델이 호출할 수 있는 tool 목록이다. */
  tools?: readonly OllamaTool[];
  /** 반환할 상위 token log probability 개수다. */
  top_logprobs?: number;
}
