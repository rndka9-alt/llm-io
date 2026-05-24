export function undefinedIfEmptyObject<TObject extends Record<string, unknown>>(
  object: TObject,
): TObject | undefined {
  if (Object.keys(object).length === 0) {
    return undefined;
  }

  return object;
}
