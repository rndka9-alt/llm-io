import { GenericHttpProvider, type GenericHttpProviderOptions } from "./generic-http-provider.js";

export interface OllamaCloudProviderOptions extends Omit<GenericHttpProviderOptions, "baseUrl"> {
  baseUrl?: string;
}

export class OllamaCloudProvider extends GenericHttpProvider {
  readonly id = "ollama-cloud";

  constructor(options: OllamaCloudProviderOptions = {}) {
    super({
      ...options,
      baseUrl: options.baseUrl ?? "https://ollama.com/api",
    });
  }
}
