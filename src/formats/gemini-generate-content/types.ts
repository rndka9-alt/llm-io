import type { JsonObject } from "../../core/json";

export type GeminiResponseMimeType =
  /** 일반 텍스트 응답을 요청한다. */
  | "text/plain"
  /** JSON 응답을 요청한다. */
  | "application/json"
  /** enum 문자열 응답을 요청한다. */
  | "text/x.enum";

export type GeminiHarmBlockThreshold =
  /** threshold를 명시하지 않는다. */
  | "HARM_BLOCK_THRESHOLD_UNSPECIFIED"
  /** 낮은 위험 이상을 차단한다. */
  | "BLOCK_LOW_AND_ABOVE"
  /** 중간 위험 이상을 차단한다. */
  | "BLOCK_MEDIUM_AND_ABOVE"
  /** 높은 위험만 차단한다. */
  | "BLOCK_ONLY_HIGH"
  /** 자동 차단을 사용하지 않는다. */
  | "BLOCK_NONE"
  /** safety setting을 끈다. */
  | "OFF";

export type GeminiHarmCategory =
  /** category를 명시하지 않는다. */
  | "HARM_CATEGORY_UNSPECIFIED"
  /** 혐오 표현 관련 safety category다. */
  | "HARM_CATEGORY_HATE_SPEECH"
  /** 위험한 콘텐츠 관련 safety category다. */
  | "HARM_CATEGORY_DANGEROUS_CONTENT"
  /** 괴롭힘 관련 safety category다. */
  | "HARM_CATEGORY_HARASSMENT"
  /** 성적 콘텐츠 관련 safety category다. */
  | "HARM_CATEGORY_SEXUALLY_EXPLICIT"
  /** 시민/선거 관련 safety category다. */
  | "HARM_CATEGORY_CIVIC_INTEGRITY";

export interface GeminiThinkingConfig extends JsonObject {
  /** reasoning/thought 내용을 응답 part에 포함할지 결정한다. */
  includeThoughts?: boolean;
  /** 모델 thinking에 사용할 token 예산이다. */
  thinkingBudget?: number;
}

export interface GeminiGenerationConfig extends JsonObject {
  /** 생성할 후보 응답 개수다. */
  candidateCount?: number;
  /** 같은 token 반복을 줄이기 위한 빈도 기반 penalty다. */
  frequencyPenalty?: number;
  /** 생성 출력의 최대 token 수다. */
  maxOutputTokens?: number;
  /** 이미 나온 주제 반복을 줄이기 위한 presence penalty다. */
  presencePenalty?: number;
  /** 응답 MIME type이다. */
  responseMimeType?: GeminiResponseMimeType;
  /** JSON 응답이 따라야 하는 schema다. */
  responseSchema?: JsonObject;
  /** 가능한 경우 deterministic sampling을 위한 seed다. */
  seed?: number;
  /** 생성 중단 문자열 목록이다. */
  stopSequences?: readonly string[];
  /** sampling 무작위성이다. */
  temperature?: number;
  /** Gemini thinking 동작 설정이다. */
  thinkingConfig?: GeminiThinkingConfig;
  /** sampling 후보 token 수를 제한한다. */
  topK?: number;
  /** nucleus sampling 확률 값이다. */
  topP?: number;
}

export interface GeminiSafetySetting extends JsonObject {
  /** 적용할 safety category다. */
  category: GeminiHarmCategory;
  /** 해당 category의 차단 기준이다. */
  threshold: GeminiHarmBlockThreshold;
}

export interface GeminiGenerateContentExtraBody {
  /** 사전에 생성된 cachedContent 리소스 이름이다. */
  cachedContent?: string;
  /** Gemini generationConfig에 전달할 생성 옵션이다. */
  generationConfig?: GeminiGenerationConfig;
  /** 요청에 붙일 사용자 정의 label이다. */
  labels?: JsonObject;
  /** safety category별 차단 설정이다. */
  safetySettings?: readonly GeminiSafetySetting[];
  /** tool 호출 관련 설정이다. */
  toolConfig?: JsonObject;
  /** 모델이 사용할 수 있는 tool 목록이다. */
  tools?: readonly JsonObject[];
}

export interface CreateGeminiGenerateContentRequestBodyOptions {
  /** Gemini GenerateContent request body에 병합할 추가 옵션이다. */
  extraBody?: GeminiGenerateContentExtraBody;
}
