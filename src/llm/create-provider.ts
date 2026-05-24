import type { BuiltInLlmFormatId } from "../core/format-id";
import type { LlmProvider } from "../core/provider";
import { GenericHttpProvider } from "../providers/generic-http-provider";
import { omitUndefined } from "../utils/object";
import type { LlmOptions } from "./types";

export function createProvider<TRaw, TExtras, TId extends string = BuiltInLlmFormatId>(
  options: LlmOptions<TRaw, TExtras, TId>,
): LlmProvider {
  if ("provider" in options) {
    return options.provider;
  }

  return new GenericHttpProvider(
    omitUndefined({
      baseUrl: options.baseUrl,
      apiKey: options.apiKey,
      headers: options.headers,
    }),
  );
}
