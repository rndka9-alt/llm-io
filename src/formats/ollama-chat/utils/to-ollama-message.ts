import { LlmIoError } from "../../../core/errors";
import type { JsonValue } from "../../../types/json";
import type { LlmMessage, LlmToolCallPart, LlmToolResultPart } from "../../../core/message";
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
  const toolCalls = message.content.filter(isToolCallPart);
  const toolResults = message.content.filter(isToolResultPart);

  if (toolCalls.length > 0 && toolResults.length > 0) {
    throw new LlmIoError("Ollama messages cannot mix tool-call and tool-result content parts.");
  }

  if (toolCalls.length > 0) {
    return toOllamaAssistantToolCallMessage(message, toolCalls);
  }

  if (toolResults.length > 0) {
    return toOllamaToolResultMessage(message, toolResults);
  }

  if (message.role === "tool") {
    throw new LlmIoError("Ollama tool messages require a tool-result content part.");
  }

  assertOnlyTextContent(message);

  if (message.role === "assistant") {
    return {
      role: "assistant",
      content: getMessageText(message),
    };
  }

  return {
    role: message.role,
    content: getMessageText(message),
  };
}

function assertOnlyTextContent(message: LlmMessage): void {
  const unsupportedContentPart = message.content.find((contentPart) => contentPart.type !== "text");

  if (unsupportedContentPart !== undefined) {
    throw new LlmIoError(
      `Ollama messages do not support ${unsupportedContentPart.type} content parts.`,
    );
  }
}

function toOllamaAssistantToolCallMessage(
  message: LlmMessage,
  toolCalls: readonly LlmToolCallPart[],
): OllamaMessage {
  if (message.role !== "assistant") {
    throw new LlmIoError("Ollama tool-call content parts require assistant messages.");
  }

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

function toOllamaToolResultMessage(
  message: LlmMessage,
  toolResults: readonly LlmToolResultPart[],
): OllamaMessage {
  const firstToolResult = toolResults[0];

  if (message.role !== "tool") {
    throw new LlmIoError("Ollama tool-result content parts require tool messages.");
  }

  if (message.content.length !== toolResults.length) {
    throw new LlmIoError("Ollama tool messages support only tool-result content parts.");
  }

  if (toolResults.length > 1) {
    throw new LlmIoError("Ollama tool messages support exactly one tool-result content part.");
  }

  if (firstToolResult === undefined) {
    throw new LlmIoError("Ollama tool messages require a tool-result content part.");
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

function isToolCallPart(
  contentPart: LlmMessage["content"][number],
): contentPart is LlmToolCallPart {
  return contentPart.type === "tool-call";
}

function isToolResultPart(
  contentPart: LlmMessage["content"][number],
): contentPart is LlmToolResultPart {
  return contentPart.type === "tool-result";
}
