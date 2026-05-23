import type { OpenAIResponsesExtras } from "../parse-response";
import type { OpenAIResponsesRaw } from "../raw-schema";

export function createOpenAIResponsesExtras(raw: OpenAIResponsesRaw): OpenAIResponsesExtras {
  return {
    provider: "openai-responses",
    ...(raw.id === undefined ? {} : { responseId: raw.id }),
  };
}
