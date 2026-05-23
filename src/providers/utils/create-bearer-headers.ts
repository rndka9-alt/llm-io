export interface BearerHeadersOptions {
  apiKey?: string;
  headers?: Record<string, string>;
}

export function createBearerHeaders(options: BearerHeadersOptions): Record<string, string> {
  return {
    "content-type": "application/json",
    ...options.headers,
    ...(options.apiKey === undefined ? {} : { authorization: `Bearer ${options.apiKey}` }),
  };
}
