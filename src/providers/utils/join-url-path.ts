export function joinUrlPath(baseUrl: string, relativePath: string | undefined): string {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  if (relativePath === undefined || relativePath.length === 0) {
    return normalizedBaseUrl;
  }

  return `${normalizedBaseUrl}/${relativePath.replace(/^\//, "")}`;
}
