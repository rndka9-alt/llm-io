import { LlmIoError } from "../../../core/errors";
import type { LlmMessage } from "../../../core/message";
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
  if (message.role === "tool") {
    return createOpenAIResponsesToolResultInputItems(message);
  }

  const inputItems: OpenAIResponsesInputItem[] = [];
  const text = getMessageText(message);

  if (text.length > 0) {
    inputItems.push({
      role: message.role,
      content: text,
    });
  }

  for (const contentPart of message.content) {
    if (contentPart.type === "tool-result") {
      throw new LlmIoError("OpenAI responses tool results require tool messages.");
    }

    if (contentPart.type !== "tool-call") {
      continue;
    }

    if (message.role !== "assistant") {
      throw new LlmIoError("OpenAI responses tool calls require assistant messages.");
    }

    if (contentPart.id === undefined) {
      throw new LlmIoError("OpenAI responses tool calls require an id.");
    }

    inputItems.push({
      type: "function_call",
      call_id: contentPart.id,
      name: contentPart.name,
      arguments: JSON.stringify(contentPart.arguments),
    });
  }

  if (inputItems.length === 0) {
    return [
      {
        role: message.role,
        content: text,
      },
    ];
  }

  return inputItems;
}

function createOpenAIResponsesToolResultInputItems(
  message: LlmMessage,
): OpenAIResponsesInputItem[] {
  const inputItems: OpenAIResponsesInputItem[] = [];

  for (const contentPart of message.content) {
    if (contentPart.type !== "tool-result") {
      throw new LlmIoError("OpenAI responses tool messages require tool-result content parts.");
    }

    if (contentPart.id === undefined) {
      throw new LlmIoError("OpenAI responses tool results require an id.");
    }

    inputItems.push({
      type: "function_call_output",
      call_id: contentPart.id,
      output: JSON.stringify(contentPart.result),
    });
  }

  if (inputItems.length === 0) {
    throw new LlmIoError("OpenAI responses tool messages require a tool-result content part.");
  }

  return inputItems;
}
