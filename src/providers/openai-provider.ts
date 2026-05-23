import { GenericHttpProvider, type GenericHttpProviderOptions } from "./generic-http-provider.js";
import { resolveOpenAICompatibleRequestPath } from "./utils/index.js";

export interface OpenAIProviderOptions extends Omit<
  GenericHttpProviderOptions,
  "baseUrl" | "resolveRequestPath"
> {
  baseUrl?: string;
}

export class OpenAIProvider extends GenericHttpProvider {
  readonly id = "openai";

  constructor(options: OpenAIProviderOptions = {}) {
    super({
      ...options,
      baseUrl: options.baseUrl ?? "https://api.openai.com/v1",
      resolveRequestPath: resolveOpenAICompatibleRequestPath,
    });
  }
}
