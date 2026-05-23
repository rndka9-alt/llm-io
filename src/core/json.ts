export type JsonPrimitive = string | number | boolean | null;

export type JsonArray = readonly JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue | undefined;
}

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export function isJsonObject(value: unknown): value is JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(
    (propertyValue) => propertyValue === undefined || isJsonValue(propertyValue),
  );
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) {
    return true;
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  return isJsonObject(value);
}
