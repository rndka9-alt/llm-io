import { LlmIoError } from "../../core/errors";
import type { LlmFormat } from "../../core/format";

export function throwUnsupportedFormat(
  providerId: string,
  format: LlmFormat<unknown, unknown>,
): never {
  throw new LlmIoError(`${providerId} provider does not support ${format.id} format.`);
}
