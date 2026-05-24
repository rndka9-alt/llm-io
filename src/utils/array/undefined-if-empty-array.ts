export function undefinedIfEmptyArray<TValue>(
  value: readonly TValue[],
): readonly TValue[] | undefined {
  if (value.length === 0) {
    return undefined;
  }

  return value;
}
