export function appendApiKey(url: string, apiKey: string): string {
  const separator = url.includes("?") ? "&" : "?";

  return `${url}${separator}key=${encodeURIComponent(apiKey)}`;
}
