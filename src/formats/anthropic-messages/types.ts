import type { JsonObject, JsonSchemaObject } from "../../core/json";

export type AnthropicMessagesServiceTier =
  /** Anthropic이 사용 가능한 처리 계층을 자동 선택한다. */
  | "auto"
  /** standard 처리 계층만 사용하도록 제한한다. */
  | "standard_only";

export type AnthropicMessagesThinking =
  | AnthropicMessagesEnabledThinking
  | AnthropicMessagesDisabledThinking;

export type AnthropicMessagesToolChoice =
  | AnthropicMessagesAutoToolChoice
  | AnthropicMessagesAnyToolChoice
  | AnthropicMessagesNamedToolChoice
  | AnthropicMessagesNoneToolChoice;

export type AnthropicCacheControlTimeToLive =
  /** 캐시를 5분 동안 유지한다. */
  | "5m"
  /** 캐시를 1시간 동안 유지한다. */
  | "1h";

export interface AnthropicCacheControl extends JsonObject {
  /** prompt caching 유지 시간이다. */
  ttl?: AnthropicCacheControlTimeToLive;
  /** 해당 content block 또는 tool definition을 임시 캐시 대상으로 표시한다. */
  type: "ephemeral";
}

export interface AnthropicTextBlock extends JsonObject {
  /** 이 text block에 적용할 prompt caching 설정이다. */
  cache_control?: AnthropicCacheControl;
  /** Anthropic content block의 텍스트 내용이다. */
  text: string;
  /** Anthropic text content block 식별자다. */
  type: "text";
}

export interface AnthropicImageBlock extends JsonObject {
  cache_control?: AnthropicCacheControl;
  source: JsonObject;
  type: "image";
}

export interface AnthropicDocumentBlock extends JsonObject {
  cache_control?: AnthropicCacheControl;
  source: JsonObject;
  type: "document";
}

export interface AnthropicSearchResultBlock extends JsonObject {
  cache_control?: AnthropicCacheControl;
  citations?: JsonObject;
  content: readonly AnthropicTextBlock[];
  source: string;
  title?: string | null;
  type: "search_result";
}

export interface AnthropicThinkingBlock extends JsonObject {
  signature?: string;
  thinking: string;
  type: "thinking";
}

export interface AnthropicRedactedThinkingBlock extends JsonObject {
  data?: string;
  type: "redacted_thinking";
}

export interface AnthropicToolUseBlock extends JsonObject {
  /** 모델이 요청한 tool call id다. */
  id: string;
  /** tool input JSON object다. */
  input: JsonObject;
  /** 모델이 호출할 tool 이름이다. */
  name: string;
  /** Anthropic tool use content block 식별자다. */
  type: "tool_use";
}

export interface AnthropicToolResultBlock extends JsonObject {
  /** tool 실행 실패 여부다. */
  is_error?: boolean;
  /** tool 실행 결과다. */
  content: string;
  /** 대응하는 tool_use id다. */
  tool_use_id: string;
  /** Anthropic tool result content block 식별자다. */
  type: "tool_result";
}

export type AnthropicContentBlock =
  | AnthropicTextBlock
  | AnthropicImageBlock
  | AnthropicDocumentBlock
  | AnthropicSearchResultBlock
  | AnthropicThinkingBlock
  | AnthropicRedactedThinkingBlock
  | AnthropicToolUseBlock
  | AnthropicToolResultBlock;

export interface AnthropicMessage extends JsonObject {
  /** Anthropic message의 content block 목록이다. */
  content: AnthropicContentBlock[];
  /** Anthropic Messages API가 허용하는 대화 role이다. */
  role: "assistant" | "user";
}

export interface AnthropicMessagesMetadata extends JsonObject {
  /** Anthropic 콘솔/로그에서 추적할 최종 사용자 식별자다. */
  user_id?: string;
}

export interface AnthropicMessagesEnabledThinking extends JsonObject {
  /** extended thinking에 배정할 token 예산이다. */
  budget_tokens: number;
  /** extended thinking을 켠다. */
  type: "enabled";
}

export interface AnthropicMessagesDisabledThinking extends JsonObject {
  /** extended thinking을 끈다. */
  type: "disabled";
}

export interface AnthropicTool extends JsonObject {
  /** 이 tool definition에 적용할 prompt caching 설정이다. */
  cache_control?: AnthropicCacheControl;
  /** 모델이 tool 사용 시 참고할 설명이다. */
  description?: string;
  /** tool input의 JSON Schema다. */
  input_schema: JsonSchemaObject;
  /** 모델이 호출할 tool 이름이다. */
  name: string;
}

export interface AnthropicMessagesAutoToolChoice extends JsonObject {
  /** tool을 여러 개 병렬 호출하지 못하게 제한한다. */
  disable_parallel_tool_use?: boolean;
  /** 모델이 tool 호출 여부를 결정한다. */
  type: "auto";
}

export interface AnthropicMessagesAnyToolChoice extends JsonObject {
  /** tool을 여러 개 병렬 호출하지 못하게 제한한다. */
  disable_parallel_tool_use?: boolean;
  /** 모델이 제공된 tool 중 하나를 반드시 호출하게 한다. */
  type: "any";
}

export interface AnthropicMessagesNamedToolChoice extends JsonObject {
  /** tool을 여러 개 병렬 호출하지 못하게 제한한다. */
  disable_parallel_tool_use?: boolean;
  /** 강제로 호출할 tool 이름이다. */
  name: string;
  /** 특정 tool 호출을 강제한다. */
  type: "tool";
}

export interface AnthropicMessagesNoneToolChoice extends JsonObject {
  /** tool 호출을 금지한다. */
  type: "none";
}

export interface AnthropicMessagesExtraBody {
  /** Anthropic container 기능을 사용할 때 이어갈 container id다. */
  container?: string | null;
  /** 응답 출력 형식 설정이다. */
  output_config?: JsonObject;
  /** 추론 처리 지역 설정이다. */
  inference_geo?: string;
  /** Anthropic MCP connector 서버 설정 목록이다. */
  mcp_servers?: readonly JsonObject[];
  /** 요청 추적용 metadata다. */
  metadata?: AnthropicMessagesMetadata;
  /** Anthropic 처리 계층을 지정한다. */
  service_tier?: AnthropicMessagesServiceTier;
  /** 생성 중단 문자열 목록이다. */
  stop_sequences?: readonly string[];
  /** streaming 응답을 요청한다. 현재 Llm.generate는 JSON 응답만 처리한다. */
  stream?: boolean;
  /** extended thinking 사용 여부와 token 예산이다. */
  thinking?: AnthropicMessagesThinking;
  /** tool 호출 정책을 지정한다. */
  tool_choice?: AnthropicMessagesToolChoice;
  /** 모델이 호출할 수 있는 tool definition 목록이다. */
  tools?: readonly AnthropicTool[];
  /** sampling 후보 token 수를 제한한다. */
  top_k?: number;
}

export interface CreateAnthropicMessagesRequestBodyOptions {
  /** Anthropic Messages request body에 병합할 추가 옵션이다. */
  extraBody?: AnthropicMessagesExtraBody;
  /** Anthropic이 요구하는 최대 출력 token 수다. */
  maxTokens: number;
  /** 호출할 Anthropic-compatible model id다. */
  model: string;
}
