import type { LlmFormat } from "../../core/format.js";
import { readRequiredFormatModel } from "./read-required-format-model.js";
import { throwUnsupportedFormat } from "./throw-unsupported-format.js";

export function readGeminiGenerateContentModel(
  format: LlmFormat<unknown, unknown>,
  providerId: string,
): string {
  if (format.id !== "gemini-generate-content") {
    throwUnsupportedFormat(providerId, format);
  }

  return readRequiredFormatModel(format, providerId);
}
