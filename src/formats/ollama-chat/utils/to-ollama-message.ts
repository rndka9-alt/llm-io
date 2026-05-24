import { LlmIoError } from "../../../core/errors";
import type { JsonValue } from "../../../core/json";
import type { LlmMessage } from "../../../core/message";
import { getMessageText } from "../../../core/message";

export type OllamaMessage =
  | {
      content: string;
      role: "system" | "user";
    }
  | {
      content: string;
      role: "assistant";
      tool_calls?: {
        function: {
          arguments: JsonValue;
          name: string;
        };
      }[];
    }
  | {
      content: string;
      role: "tool";
      tool_name: string;
    };

export function toOllamaMessage(message: LlmMessage): OllamaMessage {
  if (message.role === "tool") {
    return toOllamaToolMessage(message);
  }

  if (message.role === "assistant") {
    const toolCalls = message.content.filter((contentPart) => contentPart.type === "tool-call");

    if (toolCalls.length > 0) {
      return {
        role: "assistant",
        content: getMessageText(message),
        tool_calls: toolCalls.map((toolCall) => ({
          function: {
            name: toolCall.name,
            arguments: toolCall.arguments,
          },
        })),
      };
    }
  }

  return {
    role: message.role,
    content: getMessageText(message),
  };
}

function toOllamaToolMessage(message: LlmMessage): OllamaMessage {
  const toolResults = message.content.filter((contentPart) => contentPart.type === "tool-result");
  const firstToolResult = toolResults[0];

  if (firstToolResult === undefined) {
    throw new LlmIoError("Ollama tool messages require a tool-result content part.");
  }

  if (toolResults.length > 1) {
    throw new LlmIoError("Ollama tool messages support exactly one tool-result content part.");
  }

  return {
    role: "tool",
    tool_name: firstToolResult.name,
    content: stringifyToolResult(firstToolResult.result),
  };
}

function stringifyToolResult(result: JsonValue): string {
  if (typeof result === "string") {
    return result;
  }

  return JSON.stringify(result);
}
