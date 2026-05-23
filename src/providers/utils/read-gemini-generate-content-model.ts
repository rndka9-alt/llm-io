import type { LlmFormat } from "../../core/format";
import { readRequiredFormatModel } from "./read-required-format-model";
import { throwUnsupportedFormat } from "./throw-unsupported-format";

export function readGeminiGenerateContentModel(
  format: LlmFormat<unknown, unknown>,
  providerId: string,
): string {
  if (format.id !== "gemini-generate-content") {
    throwUnsupportedFormat(providerId, format);
  }

  return readRequiredFormatModel(format, providerId);
}
