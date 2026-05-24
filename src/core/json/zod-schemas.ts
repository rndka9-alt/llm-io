import { z } from "zod";

import { isJsonObject } from "./is-json-object";
import { isJsonValue } from "./is-json-value";
import type { JsonObject, JsonValue } from "./types";

export const jsonObjectSchema = z.custom<JsonObject>(isJsonObject, {
  message: "Expected a JSON object.",
});

export const jsonValueSchema = z.custom<JsonValue>(isJsonValue, {
  message: "Expected a JSON value.",
});
