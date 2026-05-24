import { LlmIoError } from "../../../core/errors";
import type { LlmMessage } from "../../../core/message";
import { getMessageText } from "../../../core/message";
import type { JsonValue } from "../../../core/json";

export type OpenAIMessage =
  | {
      content: string;
      role: "system" | "user";
    }
  | {
      content: string | null;
      role: "assistant";
      tool_calls?: {
        function: {
          arguments: string;
          name: string;
        };
        id: string;
        type: "function";
      }[];
    }
  | {
      content: string;
      role: "tool";
      tool_call_id: string;
    };

export function toOpenAIMessage(message: LlmMessage): OpenAIMessage {
  if (message.role === "tool") {
    return toOpenAIToolMessage(message);
  }

  if (message.role === "assistant") {
    const toolCalls = message.content.filter((contentPart) => contentPart.type === "tool-call");

    if (toolCalls.length > 0) {
      return {
        role: "assistant",
        content: getMessageText(message).length === 0 ? null : getMessageText(message),
        tool_calls: toolCalls.map((toolCall) => {
          if (toolCall.id === undefined) {
            throw new LlmIoError("OpenAI assistant tool calls require an id.");
          }

          return {
            id: toolCall.id,
            type: "function",
            function: {
              name: toolCall.name,
              arguments: JSON.stringify(toolCall.arguments),
            },
          };
        }),
      };
    }
  }

  return {
    role: message.role,
    content: getMessageText(message),
  };
}

function toOpenAIToolMessage(message: LlmMessage): OpenAIMessage {
  const toolResults = message.content.filter((contentPart) => contentPart.type === "tool-result");
  const firstToolResult = toolResults[0];

  if (firstToolResult === undefined) {
    throw new LlmIoError("OpenAI tool messages require a tool-result content part.");
  }

  if (firstToolResult.id === undefined) {
    throw new LlmIoError("OpenAI tool result messages require an id.");
  }

  if (toolResults.length > 1) {
    throw new LlmIoError("OpenAI tool messages support exactly one tool-result content part.");
  }

  return {
    role: "tool",
    tool_call_id: firstToolResult.id,
    content: stringifyToolResult(firstToolResult.result),
  };
}

function stringifyToolResult(result: JsonValue): string {
  if (typeof result === "string") {
    return result;
  }

  return JSON.stringify(result);
}
