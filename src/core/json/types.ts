export type JsonPrimitive = string | number | boolean | null;

export type JsonArray = readonly JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue | undefined;
}

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface JsonSchemaObject extends JsonObject {
  type: "object";
  additionalProperties?: boolean | JsonObject;
  properties?: JsonObject;
  required?: readonly string[];
}
