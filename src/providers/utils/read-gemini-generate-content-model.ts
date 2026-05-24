import type { LlmFormat } from "../../core/format";
import { LLM_FORMAT_IDS } from "../../core/format-id";
import { readRequiredFormatModel } from "./read-required-format-model";
import { throwUnsupportedFormat } from "./throw-unsupported-format";

export function readGeminiGenerateContentModel(
  format: LlmFormat<unknown, unknown, string>,
  providerId: string,
): string {
  if (format.id !== LLM_FORMAT_IDS.geminiGenerateContent) {
    throwUnsupportedFormat(providerId, format);
  }

  return readRequiredFormatModel(format, providerId);
}
