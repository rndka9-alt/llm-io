import type { LlmFormat } from "../../core/format.js";
import { readGeminiGenerateContentModel } from "./read-gemini-generate-content-model.js";

export function createGeminiGenerateContentRequestPath(
  format: LlmFormat<unknown, unknown>,
  providerId: string,
): string {
  return `models/${encodeURIComponent(readGeminiGenerateContentModel(format, providerId))}:generateContent`;
}
