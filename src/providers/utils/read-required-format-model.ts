import { LlmIoError } from "../../core/errors";
import type { LlmFormat } from "../../core/format";

export function readRequiredFormatModel(
  format: LlmFormat<unknown, unknown>,
  providerId: string,
): string {
  if (format.model === undefined || format.model.length === 0) {
    throw new LlmIoError(`${providerId} provider requires ${format.id} format to expose a model.`);
  }

  return format.model;
}
