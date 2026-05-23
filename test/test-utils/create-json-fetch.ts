import type { FetchLike } from "../../src/index";

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
