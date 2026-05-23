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

export function joinUrlPath(baseUrl: string, requestPath: string | undefined): string {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  if (requestPath === undefined || requestPath.length === 0) {
    return normalizedBaseUrl;
  }

  return `${normalizedBaseUrl}/${requestPath.replace(/^\//, "")}`;
}
