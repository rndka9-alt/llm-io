import { z } from "zod";

import type { JsonObject, JsonValue } from "../../types/json";
import { isJsonObject } from "./is-json-object";
import { isJsonValue } from "./is-json-value";

export const jsonObjectSchema = z.custom<JsonObject>(isJsonObject, {
  message: "Expected a JSON object.",
});

export const jsonValueSchema = z.custom<JsonValue>(isJsonValue, {
  message: "Expected a JSON value.",
});
