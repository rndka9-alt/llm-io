import type { FetchLike } from "../../src/index";
import type { FetchCall } from "./types";

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
