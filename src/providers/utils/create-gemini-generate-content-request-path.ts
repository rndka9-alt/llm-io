import type { LlmFormat } from "../../core/format";
import { readGeminiGenerateContentModel } from "./read-gemini-generate-content-model";

export function createGeminiGenerateContentRequestPath(
  format: LlmFormat<unknown, unknown>,
  providerId: string,
  options: { stream?: boolean } = {},
): string {
  const method = options.stream === true ? "streamGenerateContent" : "generateContent";

  return `models/${encodeURIComponent(readGeminiGenerateContentModel(format, providerId))}:${method}`;
}
