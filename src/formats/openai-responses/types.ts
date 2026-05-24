import type { JsonObject, JsonSchemaObject } from "../../core/json";

export type OpenAIResponsesInclude =
  /** code interpreter 실행 결과를 응답에 포함한다. */
  | "code_interpreter_call.outputs"
  /** computer tool 출력 이미지 URL을 응답에 포함한다. */
  | "computer_call_output.output.image_url"
  /** file search 결과를 응답에 포함한다. */
  | "file_search_call.results"
  /** 입력 이미지 URL을 응답에 포함한다. */
  | "message.input_image.image_url"
  /** 출력 텍스트 token log probability를 포함한다. */
  | "message.output_text.logprobs"
  /** reasoning encrypted content를 포함해 후속 요청에 재사용할 수 있게 한다. */
  | "reasoning.encrypted_content";

/** 프롬프트 캐시를 유지할 기간이다. */
export type OpenAIResponsesPromptCacheRetention = "24h";

export type OpenAIResponsesReasoningEffort =
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

export type OpenAIResponsesReasoningSummary =
  /** 모델/API가 적절한 reasoning summary 수준을 선택한다. */
  | "auto"
  /** 짧은 reasoning summary를 요청한다. */
  | "concise"
  /** 더 자세한 reasoning summary를 요청한다. */
  | "detailed"
  /** reasoning summary를 요청하지 않는다. */
  | null;

export type OpenAIResponsesServiceTier =
  /** 프로젝트 기본 설정에 따라 처리 계층을 자동 선택한다. */
  | "auto"
  /** 기본 처리 계층을 사용한다. */
  | "default"
  /** 지연 시간보다 비용 효율을 우선하는 flex 계층을 사용한다. */
  | "flex"
  /** 낮은 지연 시간을 우선하는 priority 계층을 사용한다. */
  | "priority";

export type OpenAIResponsesToolChoice =
  /** 도구 호출을 금지한다. */
  | "none"
  /** 모델이 도구 호출 여부를 결정한다. */
  | "auto"
  /** 모델이 하나 이상의 도구를 호출하도록 강제한다. */
  | "required"
  /** 특정 hosted tool 또는 function tool을 지정한다. */
  | JsonObject;

export interface OpenAIResponsesFunctionTool extends JsonObject {
  /** 모델이 tool 사용 시 참고할 설명이다. */
  description?: string;
  /** 모델이 호출할 함수 이름이다. */
  name: string;
  /** 함수 인자의 JSON Schema object다. */
  parameters?: JsonSchemaObject;
  /** 지원 모델에서 schema 엄격 준수를 요청한다. */
  strict?: boolean;
  /** OpenAI Responses function tool 식별자다. */
  type: "function";
}

export type OpenAIResponsesTool = OpenAIResponsesFunctionTool | JsonObject;

export type OpenAIResponsesTruncation =
  /** context 초과 시 API가 입력 일부를 자동으로 잘라낸다. */
  | "auto"
  /** 자동 truncation을 끄고 context 초과를 오류로 받는다. */
  | "disabled";

export type OpenAIResponsesVerbosity =
  /** 더 짧고 간결한 답변을 유도한다. */
  | "low"
  /** 모델 기본에 가까운 답변 길이를 사용한다. */
  | "medium"
  /** 더 자세한 답변을 유도한다. */
  | "high";

export interface OpenAIResponsesReasoningOptions extends JsonObject {
  /** reasoning 모델의 추론 강도다. */
  effort?: OpenAIResponsesReasoningEffort;
  /** reasoning summary를 어느 정도로 받을지 지정한다. */
  summary?: OpenAIResponsesReasoningSummary;
}

export interface OpenAIResponsesTextFormatText extends JsonObject {
  /** 일반 텍스트 응답을 요청한다. */
  type: "text";
}

export interface OpenAIResponsesTextFormatJsonObject extends JsonObject {
  /** JSON object 모드 응답을 요청한다. */
  type: "json_object";
}

export interface OpenAIResponsesTextFormatJsonSchema extends JsonObject {
  /** schema 목적을 설명하는 문장이다. */
  description?: string;
  /** 응답 schema 이름이다. */
  name: string;
  /** 모델이 맞춰야 하는 JSON Schema다. */
  schema: JsonObject;
  /** 지원 모델에서 schema 엄격 준수를 요청한다. */
  strict?: boolean;
  /** JSON Schema 기반 구조화 출력을 요청한다. */
  type: "json_schema";
}

export type OpenAIResponsesTextFormat =
  | OpenAIResponsesTextFormatText
  | OpenAIResponsesTextFormatJsonObject
  | OpenAIResponsesTextFormatJsonSchema;

export interface OpenAIResponsesTextOptions extends JsonObject {
  /** 출력 텍스트 형식이다. */
  format?: OpenAIResponsesTextFormat;
  /** 지원 모델에서 답변 자세함을 조정한다. */
  verbosity?: OpenAIResponsesVerbosity;
}

export interface OpenAIResponsesExtraBody {
  /** 비동기 background response 생성을 요청한다. */
  background?: boolean;
  /** 이어갈 conversation id 또는 conversation 객체다. */
  conversation?: string | JsonObject | null;
  /** 응답에 추가로 포함할 상세 필드 목록이다. */
  include?: readonly OpenAIResponsesInclude[];
  /** 현재 요청에만 적용할 추가 지시문이다. */
  instructions?: string | null;
  /** 한 response에서 허용할 최대 tool call 수다. */
  max_tool_calls?: number;
  /** provider/API에서 추적할 사용자 정의 metadata다. */
  metadata?: JsonObject | null;
  /** 여러 tool call을 병렬로 허용할지 결정한다. */
  parallel_tool_calls?: boolean;
  /** 이전 response를 이어서 생성할 때 사용하는 id다. */
  previous_response_id?: string | null;
  /** 저장된 prompt template과 변수 정보를 지정한다. */
  prompt?: JsonObject;
  /** OpenAI prompt cache를 공유할 키다. */
  prompt_cache_key?: string;
  /** OpenAI prompt cache retention 정책이다. */
  prompt_cache_retention?: OpenAIResponsesPromptCacheRetention;
  /** reasoning 모델의 추론 강도와 summary 출력을 설정한다. */
  reasoning?: OpenAIResponsesReasoningOptions | null;
  /** abuse monitoring에 사용할 최종 사용자 식별자다. */
  safety_identifier?: string;
  /** OpenAI 처리 계층을 지정한다. */
  service_tier?: OpenAIResponsesServiceTier | null;
  /** provider가 응답을 저장할지 결정한다. */
  store?: boolean | null;
  /** streaming 응답을 요청한다. 현재 Llm.generate는 JSON 응답만 처리한다. */
  stream?: boolean | null;
  /** 출력 텍스트 형식과 자세함을 설정한다. */
  text?: OpenAIResponsesTextOptions;
  /** tool 호출 정책을 지정한다. */
  tool_choice?: OpenAIResponsesToolChoice;
  /** 모델이 호출할 수 있는 도구 목록이다. */
  tools?: readonly OpenAIResponsesTool[];
  /** context 초과 시 입력을 자동으로 줄일지 결정한다. */
  truncation?: OpenAIResponsesTruncation;
  /** provider/API에 전달할 최종 사용자 식별자다. */
  user?: string;
}
