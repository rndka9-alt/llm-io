import { omitUndefined } from "../../utils/object";

export interface BearerHeadersOptions {
  apiKey?: string;
  headers?: Record<string, string>;
}

export function createBearerHeaders(options: BearerHeadersOptions): Record<string, string> {
  return {
    "content-type": "application/json",
    ...options.headers,
    ...omitUndefined({
      authorization: createAuthorizationHeader(options.apiKey),
    }),
  };
}

function createAuthorizationHeader(apiKey: string | undefined): string | undefined {
  if (apiKey === undefined) {
    return undefined;
  }

  return `Bearer ${apiKey}`;
}
