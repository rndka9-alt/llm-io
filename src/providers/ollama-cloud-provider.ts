import { GenericHttpProvider, type GenericHttpProviderOptions } from "./generic-http-provider.js";
import { resolveOllamaRequestPath } from "./utils.js";

export interface OllamaCloudProviderOptions extends Omit<
  GenericHttpProviderOptions,
  "baseUrl" | "resolveRequestPath"
> {
  baseUrl?: string;
}

export class OllamaCloudProvider extends GenericHttpProvider {
  readonly id = "ollama-cloud";

  constructor(options: OllamaCloudProviderOptions = {}) {
    super({
      ...options,
      baseUrl: options.baseUrl ?? "https://ollama.com/api",
      resolveRequestPath: resolveOllamaRequestPath,
    });
  }
}
