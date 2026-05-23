import type { LlmProvider } from "../core/provider";
import { GenericHttpProvider } from "../providers/generic-http-provider";
import type { LlmOptions } from "./types";

export function createProvider<TRaw, TExtras>(options: LlmOptions<TRaw, TExtras>): LlmProvider {
  if ("provider" in options) {
    return options.provider;
  }

  return new GenericHttpProvider({
    baseUrl: options.baseUrl,
    ...(options.apiKey === undefined ? {} : { apiKey: options.apiKey }),
    ...(options.headers === undefined ? {} : { headers: options.headers }),
  });
}
