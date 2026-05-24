type OptionalUndefinedKeys<TObject extends Record<string, unknown>> = {
  [TKey in keyof TObject]: undefined extends TObject[TKey] ? TKey : never;
}[keyof TObject];

type RequiredDefinedKeys<TObject extends Record<string, unknown>> = Exclude<
  keyof TObject,
  OptionalUndefinedKeys<TObject>
>;

export type OmitUndefined<TObject extends Record<string, unknown>> = {
  [TKey in RequiredDefinedKeys<TObject>]: Exclude<TObject[TKey], undefined>;
} & {
  [TKey in OptionalUndefinedKeys<TObject>]?: Exclude<TObject[TKey], undefined>;
};

export function omitUndefined<const TObject extends Record<string, unknown>>(
  object: TObject,
): OmitUndefined<TObject>;

export function omitUndefined(object: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key in object) {
    const value = object[key];

    if (isDefined(value)) {
      result[key] = value;
    }
  }

  return result;
}

function isDefined<TValue>(value: TValue): value is Exclude<TValue, undefined> {
  return value !== undefined;
}
