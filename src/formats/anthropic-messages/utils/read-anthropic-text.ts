import { isJsonObject } from "../../../core/json";

export function readAnthropicText(contentBlocks: readonly unknown[]): string {
  return contentBlocks
    .flatMap((contentBlock) => {
      if (
        !isJsonObject(contentBlock) ||
        contentBlock.type !== "text" ||
        typeof contentBlock.text !== "string"
      ) {
        return [];
      }

      return [contentBlock.text];
    })
    .join("");
}
