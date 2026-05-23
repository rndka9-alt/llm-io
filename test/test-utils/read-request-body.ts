import { isJsonObject } from "../../src/core/json";
import type { JsonObject } from "../../src/index";
import type { FetchCall } from "./types";

export function readRequestBody(call: FetchCall | undefined): JsonObject {
  if (call?.init?.body === undefined) {
    throw new Error("Expected request body.");
  }

  const parsed: unknown = JSON.parse(call.init.body);

  if (!isJsonObject(parsed)) {
    throw new Error("Expected object request body.");
  }

  return parsed;
}
