import { describe, expect, it } from "vitest";
import {
  createToolResultMessage,
  GenericHttpProvider,
  Llm,
  LlmIoError,
  OllamaChatFormat,
} from "../src/index";
import { createJsonFetch } from "./test-utils";

describe("Ollama chat format", () => {
  it("creates request bodies with options and extra body", () => {
    const format = new OllamaChatFormat({
      extraBody: {
        format: "json",
        keep_alive: "5m",
        think: "low",
        tools: [
          {
            type: "function",
            function: {
              name: "lookup",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string" },
                },
                required: ["query"],
              },
            },
          },
        ],
      },
      model: "example-model",
    });

    expect(
      format.createRequestBody({
        messages: [
          { role: "system", content: [{ type: "text", text: "rules" }] },
          { role: "user", content: [{ type: "text", text: "hi" }] },
        ],
        options: {
          maxTokens: 100,
          temperature: 0,
          topP: 0.8,
        },
      }),
    ).toEqual({
      format: "json",
      keep_alive: "5m",
      messages: [
        { role: "system", content: "rules" },
        { role: "user", content: "hi" },
      ],
      model: "example-model",
      options: {
        num_predict: 100,
        temperature: 0,
        top_p: 0.8,
      },
      stream: false,
      think: "low",
      tools: [
        {
          type: "function",
          function: {
            name: "lookup",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string" },
              },
              required: ["query"],
            },
          },
        },
      ],
    });
  });

  it("rejects unsupported Ollama extraBody values at compile time", () => {
    const formatOptions = {
      extraBody: {
        // @ts-expect-error think follows documented Ollama values.
        think: "maximum",
        tools: [
          {
            type: "function",
            function: {
              name: "lookup",
              // @ts-expect-error function tool parameters must be a JSON Schema object root.
              parameters: { properties: { query: { type: "string" } } },
            },
          },
        ],
      },
      model: "example-model",
    } satisfies ConstructorParameters<typeof OllamaChatFormat>[0];

    expect(formatOptions.model).toBe("example-model");
  });

  it("normalizes message, thinking, usage, finish reason, and extras", async () => {
    const client = new Llm({
      fetch: createJsonFetch({
        done_reason: "length",
        eval_count: 6,
        message: {
          content: "done",
          thinking: "thought",
        },
        model: "example-model",
        prompt_eval_count: 5,
      }),
      format: new OllamaChatFormat({ model: "example-model" }),
      provider: new GenericHttpProvider({ baseUrl: "https://example.test/api" }),
    });

    const output = await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(output.message.text).toBe("done");
    expect(output.reasoning?.text).toBe("thought");
    expect(output.usage?.inputTokens).toBe(5);
    expect(output.usage?.outputTokens).toBe(6);
    expect(output.usage?.totalTokens).toBe(11);
    expect(output.finishReason).toBe("length");
    expect(output.extras?.model).toBe("example-model");
  });

  it("normalizes tool calls without text", async () => {
    const client = new Llm({
      fetch: createJsonFetch({
        done_reason: "stop",
        message: {
          tool_calls: [
            {
              function: {
                name: "lookup",
                arguments: { query: "weather" },
              },
            },
          ],
        },
      }),
      format: new OllamaChatFormat({ model: "example-model" }),
      provider: new GenericHttpProvider({ baseUrl: "https://example.test/api" }),
    });

    const output = await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(output.message.text).toBe("");
    expect(output.toolCalls).toEqual([{ name: "lookup", arguments: { query: "weather" } }]);
    expect(output.message.content).toEqual([
      { type: "tool-call", name: "lookup", arguments: { query: "weather" } },
    ]);
  });

  it("creates tool result continuation bodies", () => {
    const format = new OllamaChatFormat({ model: "example-model" });
    const toolCall = { name: "lookup", arguments: { query: "weather" } };

    expect(
      format.createRequestBody({
        messages: [
          { role: "user", content: [{ type: "text", text: "weather?" }] },
          {
            role: "assistant",
            content: [{ type: "tool-call", ...toolCall }],
          },
          createToolResultMessage(toolCall, { temperature: 18 }),
        ],
      }),
    ).toEqual({
      model: "example-model",
      stream: false,
      messages: [
        { role: "user", content: "weather?" },
        {
          role: "assistant",
          content: "",
          tool_calls: [
            {
              function: {
                name: "lookup",
                arguments: { query: "weather" },
              },
            },
          ],
        },
        {
          role: "tool",
          tool_name: "lookup",
          content: '{"temperature":18}',
        },
      ],
    });
  });

  it("throws when message content is missing", () => {
    const format = new OllamaChatFormat({ model: "example-model" });

    expect(() =>
      format.parseResponse({
        message: {
          thinking: "thought",
        },
      }),
    ).toThrow(LlmIoError);
  });
});
