import { isJsonValue } from "./is-json-value";
import type { JsonObject } from "../../types/json";

export function isJsonObject(value: unknown): value is JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(
    (propertyValue) => propertyValue === undefined || isJsonValue(propertyValue),
  );
}
