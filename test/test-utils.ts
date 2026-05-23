import type { FetchLike } from "../src/index";

export interface FetchCall {
  input: string;
  init?: Parameters<FetchLike>[1];
}

export function createJsonFetch(responseJson: unknown): FetchLike {
  return async () => ({
    ok: true,
    status: 200,
    statusText: "OK",
    async json() {
      return responseJson;
    },
    async text() {
      return JSON.stringify(responseJson);
    },
  });
}

export function createRecordingFetch(responseJson: unknown): {
  calls: FetchCall[];
  fetch: FetchLike;
} {
  const calls: FetchCall[] = [];

  return {
    calls,
    fetch: async (input, init) => {
      calls.push(init === undefined ? { input } : { input, init });

      return {
        ok: true,
        status: 200,
        statusText: "OK",
        async json() {
          return responseJson;
        },
        async text() {
          return JSON.stringify(responseJson);
        },
      };
    },
  };
}

export function readRequestBody(call: FetchCall | undefined): Record<string, unknown> {
  if (call?.init?.body === undefined) {
    throw new Error("Expected request body.");
  }

  const parsed: unknown = JSON.parse(call.init.body);

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Expected object request body.");
  }

  return parsed;
}
