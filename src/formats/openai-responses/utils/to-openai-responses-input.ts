import { LlmIoError } from "../../../core/errors";
import type { LlmMessage, LlmToolCallPart, LlmToolResultPart } from "../../../core/message";
import { getMessageText } from "../../../core/message";

type OpenAIResponsesInputItem =
  | {
      content: string;
      role: Exclude<LlmMessage["role"], "tool">;
    }
  | {
      arguments: string;
      call_id: string;
      name: string;
      type: "function_call";
    }
  | {
      call_id: string;
      output: string;
      type: "function_call_output";
    };

export function toOpenAIResponsesInput(message: LlmMessage): OpenAIResponsesInputItem[] {
  const toolCalls = message.content.filter(isToolCallPart);
  const toolResults = message.content.filter(isToolResultPart);

  if (toolCalls.length > 0 && toolResults.length > 0) {
    throw new LlmIoError(
      "OpenAI responses messages cannot mix tool-call and tool-result content parts.",
    );
  }

  if (toolCalls.length > 0) {
    return createOpenAIResponsesToolCallInputItems(message, toolCalls);
  }

  if (toolResults.length > 0) {
    return createOpenAIResponsesToolResultInputItems(message, toolResults);
  }

  if (message.role === "tool") {
    throw new LlmIoError("OpenAI responses tool messages require a tool-result content part.");
  }

  assertOnlyTextContent(message);

  return [createOpenAIResponsesTextInputItem(message)];
}

function assertOnlyTextContent(message: LlmMessage): void {
  const unsupportedContentPart = message.content.find((contentPart) => contentPart.type !== "text");

  if (unsupportedContentPart !== undefined) {
    throw new LlmIoError(
      `OpenAI responses messages do not support ${unsupportedContentPart.type} content parts.`,
    );
  }
}

function createOpenAIResponsesToolCallInputItems(
  message: LlmMessage,
  toolCalls: readonly LlmToolCallPart[],
): OpenAIResponsesInputItem[] {
  if (message.role !== "assistant") {
    throw new LlmIoError("OpenAI responses tool-call content parts require assistant messages.");
  }

  const inputItems: OpenAIResponsesInputItem[] = [];
  const text = getMessageText(message);

  if (text.length > 0) {
    inputItems.push({
      role: message.role,
      content: text,
    });
  }

  for (const toolCall of toolCalls) {
    if (toolCall.id === undefined) {
      throw new LlmIoError("OpenAI responses tool calls require an id.");
    }

    inputItems.push({
      type: "function_call",
      call_id: toolCall.id,
      name: toolCall.name,
      arguments: JSON.stringify(toolCall.arguments),
    });
  }

  return inputItems;
}

function createOpenAIResponsesToolResultInputItems(
  message: LlmMessage,
  toolResults: readonly LlmToolResultPart[],
): OpenAIResponsesInputItem[] {
  if (message.role !== "tool") {
    throw new LlmIoError("OpenAI responses tool-result content parts require tool messages.");
  }

  if (message.content.length !== toolResults.length) {
    throw new LlmIoError("OpenAI responses tool messages support only tool-result content parts.");
  }

  const inputItems: OpenAIResponsesInputItem[] = [];

  for (const toolResult of toolResults) {
    if (toolResult.id === undefined) {
      throw new LlmIoError("OpenAI responses tool results require an id.");
    }

    inputItems.push({
      type: "function_call_output",
      call_id: toolResult.id,
      output: JSON.stringify(toolResult.result),
    });
  }

  if (inputItems.length === 0) {
    throw new LlmIoError("OpenAI responses tool messages require a tool-result content part.");
  }

  return inputItems;
}

function createOpenAIResponsesTextInputItem(message: LlmMessage): OpenAIResponsesInputItem {
  if (message.role === "tool") {
    throw new LlmIoError("OpenAI responses tool messages require a tool-result content part.");
  }

  return {
    role: message.role,
    content: getMessageText(message),
  };
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
