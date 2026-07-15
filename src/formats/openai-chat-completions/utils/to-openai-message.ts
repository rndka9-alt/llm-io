import { LlmIoError } from "../../../core/errors";
import type {
  LlmMessage,
  LlmTextPart,
  LlmToolCallPart,
  LlmToolResultPart,
} from "../../../core/message";
import { getMessageText } from "../../../core/message";
import type { JsonObject } from "../../../types/json";
import type { JsonValue } from "../../../types/json";

export type OpenAIMessage =
  | {
      content: string | readonly OpenAITextContentPart[];
      role: "system" | "user";
    }
  | {
      content: string | readonly OpenAITextContentPart[] | null;
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

interface OpenAITextContentPart extends JsonObject {
  prompt_cache_breakpoint?: LlmTextPart["cacheBreakpoint"];
  text: string;
  type: "text";
}

export function toOpenAIMessage(message: LlmMessage): OpenAIMessage {
  const toolCalls = message.content.filter(isToolCallPart);
  const toolResults = message.content.filter(isToolResultPart);

  if (toolCalls.length > 0 && toolResults.length > 0) {
    throw new LlmIoError("OpenAI messages cannot mix tool-call and tool-result content parts.");
  }

  if (toolCalls.length > 0) {
    return toOpenAIAssistantToolCallMessage(message, toolCalls);
  }

  if (toolResults.length > 0) {
    return toOpenAIToolResultMessage(message, toolResults);
  }

  if (message.role === "tool") {
    throw new LlmIoError("OpenAI tool messages require a tool-result content part.");
  }

  assertOnlyTextContent(message, "OpenAI");

  if (message.role === "assistant") {
    return {
      role: "assistant",
      content: createOpenAITextContent(message),
    };
  }

  return {
    role: message.role,
    content: createOpenAITextContent(message),
  };
}

function createOpenAITextContent(message: LlmMessage): string | readonly OpenAITextContentPart[] {
  const textParts = message.content.filter(isTextPart);

  if (textParts.every((textPart) => textPart.cacheBreakpoint === undefined)) {
    return getMessageText(message);
  }

  return textParts.map((textPart) => {
    if (textPart.cacheBreakpoint === undefined) {
      return { type: "text", text: textPart.text };
    }

    return {
      type: "text",
      text: textPart.text,
      prompt_cache_breakpoint: textPart.cacheBreakpoint,
    };
  });
}

function assertOnlyTextContent(message: LlmMessage, formatName: string): void {
  const unsupportedContentPart = message.content.find((contentPart) => contentPart.type !== "text");

  if (unsupportedContentPart !== undefined) {
    throw new LlmIoError(
      `${formatName} messages do not support ${unsupportedContentPart.type} content parts.`,
    );
  }
}

function toOpenAIAssistantToolCallMessage(
  message: LlmMessage,
  toolCalls: readonly LlmToolCallPart[],
): OpenAIMessage {
  if (message.role !== "assistant") {
    throw new LlmIoError("OpenAI tool-call content parts require assistant messages.");
  }

  const text = getMessageText(message);

  return {
    role: "assistant",
    content: text.length === 0 ? null : text,
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

function toOpenAIToolResultMessage(
  message: LlmMessage,
  toolResults: readonly LlmToolResultPart[],
): OpenAIMessage {
  const firstToolResult = toolResults[0];

  if (message.role !== "tool") {
    throw new LlmIoError("OpenAI tool-result content parts require tool messages.");
  }

  if (message.content.length !== toolResults.length) {
    throw new LlmIoError("OpenAI tool messages support only tool-result content parts.");
  }

  if (toolResults.length > 1) {
    throw new LlmIoError("OpenAI tool messages support exactly one tool-result content part.");
  }

  if (firstToolResult === undefined) {
    throw new LlmIoError("OpenAI tool messages require a tool-result content part.");
  }

  if (firstToolResult.id === undefined) {
    throw new LlmIoError("OpenAI tool result messages require an id.");
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

function isToolCallPart(
  contentPart: LlmMessage["content"][number],
): contentPart is LlmToolCallPart {
  return contentPart.type === "tool-call";
}

function isTextPart(contentPart: LlmMessage["content"][number]): contentPart is LlmTextPart {
  return contentPart.type === "text";
}

function isToolResultPart(
  contentPart: LlmMessage["content"][number],
): contentPart is LlmToolResultPart {
  return contentPart.type === "tool-result";
}
