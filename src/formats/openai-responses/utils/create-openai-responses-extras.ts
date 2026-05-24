import { omitUndefined } from "../../../utils/object";
import type { OpenAIResponsesExtras } from "../parse-response";
import type { OpenAIResponsesRaw } from "../raw-schema";

export function createOpenAIResponsesExtras(raw: OpenAIResponsesRaw): OpenAIResponsesExtras {
  return omitUndefined({
    provider: "openai-responses",
    responseId: raw.id,
  });
}
