import { describe, expect, it } from "vitest";
import {
  createToolResultMessage,
  GenericHttpProvider,
  Llm,
  LlmIoError,
  OpenAIChatCompletionsFormat,
  OpenAIResponsesFormat,
} from "../src/index";
import { createJsonFetch } from "./test-utils";

describe("OpenAI formats", () => {
  it("creates chat completions request bodies", () => {
    const format = new OpenAIChatCompletionsFormat({
      extraBody: {
        audio: { format: "pcm16", voice: "marin" },
        prompt_cache_retention: "in_memory",
        provider: {
          only: ["openai"],
          sort: { by: "throughput", partition: "none" },
          preferred_min_throughput: { p90: 50 },
          preferred_max_latency: 3,
          max_price: { prompt: 1, completion: 2 },
        },
        reasoning_effort: "high",
        response_format: { type: "json_object" },
        stream_options: { include_obfuscation: false, include_usage: true },
        tool_choice: { type: "function", function: { name: "lookup" } },
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
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
        options: {
          maxTokens: 100,
          temperature: 0,
          topP: 0.8,
        },
      }),
    ).toEqual({
      model: "example-model",
      messages: [{ role: "user", content: "hi" }],
      max_completion_tokens: 100,
      temperature: 0,
      top_p: 0.8,
      audio: { format: "pcm16", voice: "marin" },
      prompt_cache_retention: "in_memory",
      provider: {
        only: ["openai"],
        sort: { by: "throughput", partition: "none" },
        preferred_min_throughput: { p90: 50 },
        preferred_max_latency: 3,
        max_price: { prompt: 1, completion: 2 },
      },
      reasoning_effort: "high",
      response_format: { type: "json_object" },
      stream_options: { include_obfuscation: false, include_usage: true },
      tool_choice: { type: "function", function: { name: "lookup" } },
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

  it("rejects unsupported chat completions extraBody values at compile time", () => {
    const formatOptions = {
      extraBody: {
        // @ts-expect-error reasoning_effort follows documented OpenAI values.
        reasoning_effort: "maximum",
        // @ts-expect-error prompt_cache_retention only supports documented retention values.
        prompt_cache_retention: "7d",
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
        audio: {
          format: "pcm16",
          // @ts-expect-error audio voice follows documented built-in values or custom voice objects.
          voice: "robot",
        },
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "result",
            // @ts-expect-error json_schema.schema must be a JSON Schema object root.
            schema: { properties: { ok: { type: "boolean" } } },
          },
        },
      },
      model: "example-model",
    } satisfies ConstructorParameters<typeof OpenAIChatCompletionsFormat>[0];

    expect(formatOptions.model).toBe("example-model");
  });

  it("normalizes chat completions output", async () => {
    const client = new Llm({
      fetch: createJsonFetch({
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: "hello",
              reasoning_content: "because",
            },
          },
        ],
        usage: {
          prompt_tokens: 3,
          completion_tokens: 4,
          total_tokens: 7,
        },
      }),
      format: new OpenAIChatCompletionsFormat({ model: "example-model" }),
      provider: new GenericHttpProvider({ baseUrl: "https://example.test/v1" }),
    });

    const output = await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(output.message.text).toBe("hello");
    expect(output.reasoning?.text).toBe("because");
    expect(output.usage?.totalTokens).toBe(7);
    expect(output.raw.choices[0]?.message.content).toBe("hello");
  });

  it("normalizes chat completions tool calls without text", async () => {
    const client = new Llm({
      fetch: createJsonFetch({
        choices: [
          {
            finish_reason: "tool_calls",
            message: {
              content: null,
              tool_calls: [
                {
                  id: "call-1",
                  type: "function",
                  function: {
                    name: "lookup",
                    arguments: '{"query":"weather"}',
                  },
                },
              ],
            },
          },
        ],
      }),
      format: new OpenAIChatCompletionsFormat({ model: "example-model" }),
      provider: new GenericHttpProvider({ baseUrl: "https://example.test/v1" }),
    });

    const output = await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(output.message.text).toBe("");
    expect(output.toolCalls).toEqual([
      { id: "call-1", name: "lookup", arguments: { query: "weather" } },
    ]);
    expect(output.message.content).toEqual([
      { type: "tool-call", id: "call-1", name: "lookup", arguments: { query: "weather" } },
    ]);
    expect(output.finishReason).toBe("tool-call");
  });

  it("creates chat completions tool result continuation bodies", () => {
    const format = new OpenAIChatCompletionsFormat({ model: "example-model" });
    const toolCall = { id: "call-1", name: "lookup", arguments: { query: "weather" } };

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
      messages: [
        { role: "user", content: "weather?" },
        {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call-1",
              type: "function",
              function: {
                name: "lookup",
                arguments: '{"query":"weather"}',
              },
            },
          ],
        },
        {
          role: "tool",
          tool_call_id: "call-1",
          content: '{"temperature":18}',
        },
      ],
    });
  });

  it("throws when chat completions tool-call content is not an assistant message", () => {
    const format = new OpenAIChatCompletionsFormat({ model: "example-model" });

    expect(() =>
      format.createRequestBody({
        messages: [
          {
            role: "user",
            content: [{ type: "tool-call", id: "call-1", name: "lookup", arguments: {} }],
          },
        ],
      }),
    ).toThrow(LlmIoError);
  });

  it("throws when chat completions output text is missing", () => {
    const format = new OpenAIChatCompletionsFormat({ model: "example-model" });

    expect(() =>
      format.parseResponse({
        choices: [
          {
            message: {
              content: "",
            },
          },
        ],
      }),
    ).toThrow(LlmIoError);
  });

  it("creates responses request bodies", () => {
    const format = new OpenAIResponsesFormat({
      extraBody: {
        prompt_cache_key: "shared-prefix",
        prompt_cache_retention: "in_memory",
        reasoning: { effort: "medium", summary: "auto" },
        service_tier: "scale",
        store: false,
        stream_options: { include_obfuscation: false },
        text: {
          format: {
            type: "json_schema",
            name: "result",
            schema: { type: "object", properties: { ok: { type: "boolean" } } },
          },
          verbosity: "low",
        },
        tool_choice: { type: "function", name: "lookup" },
        tools: [
          {
            type: "function",
            name: "lookup",
            parameters: {
              type: "object",
              properties: { query: { type: "string" } },
            },
          },
          { type: "web_search_preview", search_context_size: "low" },
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
      model: "example-model",
      input: [
        { role: "system", content: "rules" },
        { role: "user", content: "hi" },
      ],
      max_output_tokens: 100,
      temperature: 0,
      top_p: 0.8,
      prompt_cache_key: "shared-prefix",
      prompt_cache_retention: "in_memory",
      reasoning: { effort: "medium", summary: "auto" },
      service_tier: "scale",
      store: false,
      stream_options: { include_obfuscation: false },
      text: {
        format: {
          type: "json_schema",
          name: "result",
          schema: { type: "object", properties: { ok: { type: "boolean" } } },
        },
        verbosity: "low",
      },
      tool_choice: { type: "function", name: "lookup" },
      tools: [
        {
          type: "function",
          name: "lookup",
          parameters: {
            type: "object",
            properties: { query: { type: "string" } },
          },
        },
        { type: "web_search_preview", search_context_size: "low" },
      ],
    });
  });

  it("creates responses tool result continuation bodies", () => {
    const format = new OpenAIResponsesFormat({ model: "example-model" });
    const toolCall = { id: "call-1", name: "lookup", arguments: { query: "weather" } };

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
      input: [
        { role: "user", content: "weather?" },
        {
          type: "function_call",
          call_id: "call-1",
          name: "lookup",
          arguments: '{"query":"weather"}',
        },
        {
          type: "function_call_output",
          call_id: "call-1",
          output: '{"temperature":18}',
        },
      ],
    });
  });

  it("throws when responses tool-call content is not an assistant message", () => {
    const format = new OpenAIResponsesFormat({ model: "example-model" });

    expect(() =>
      format.createRequestBody({
        messages: [
          {
            role: "user",
            content: [{ type: "tool-call", id: "call-1", name: "lookup", arguments: {} }],
          },
        ],
      }),
    ).toThrow(LlmIoError);
  });

  it("rejects unsupported responses extraBody values at compile time", () => {
    const formatOptions = {
      extraBody: {
        // @ts-expect-error reasoning effort follows documented Responses API values.
        reasoning: { effort: "maximum" },
        // @ts-expect-error truncation supports only documented values.
        truncation: "truncate",
        text: {
          format: {
            type: "json_schema",
            name: "result",
            // @ts-expect-error text.format.schema must be a JSON Schema object root.
            schema: { properties: { ok: { type: "boolean" } } },
          },
        },
        tools: [
          {
            type: "function",
            name: "lookup",
            // @ts-expect-error function tool parameters must be a JSON Schema object root.
            parameters: { properties: { query: { type: "string" } } },
          },
        ],
      },
      model: "example-model",
    } satisfies ConstructorParameters<typeof OpenAIResponsesFormat>[0];

    expect(formatOptions.model).toBe("example-model");
  });

  it("normalizes responses output and keeps typed extras", async () => {
    const client = new Llm({
      fetch: createJsonFetch({
        id: "response-1",
        output: [
          {
            type: "reasoning",
            summary: [{ text: "thought" }],
          },
          {
            type: "message",
            content: [{ type: "output_text", text: "done" }],
          },
        ],
        usage: {
          input_tokens: 5,
          output_tokens: 6,
          output_tokens_details: {
            reasoning_tokens: 2,
          },
          total_tokens: 11,
        },
      }),
      format: new OpenAIResponsesFormat({ model: "example-model" }),
      provider: new GenericHttpProvider({ baseUrl: "https://example.test/v1" }),
    });

    const output = await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(output.message.text).toBe("done");
    expect(output.reasoning?.text).toBe("thought");
    expect(output.usage?.reasoningTokens).toBe(2);
    expect(output.raw.output).toHaveLength(2);
    expect(output.extras?.responseId).toBe("response-1");
  });

  it("normalizes responses tool calls without text", async () => {
    const client = new Llm({
      fetch: createJsonFetch({
        id: "response-1",
        output: [
          {
            type: "function_call",
            call_id: "call-1",
            name: "lookup",
            arguments: '{"query":"weather"}',
          },
        ],
      }),
      format: new OpenAIResponsesFormat({ model: "example-model" }),
      provider: new GenericHttpProvider({ baseUrl: "https://example.test/v1" }),
    });

    const output = await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(output.message.text).toBe("");
    expect(output.toolCalls).toEqual([
      { id: "call-1", name: "lookup", arguments: { query: "weather" } },
    ]);
    expect(output.message.content).toEqual([
      { type: "tool-call", id: "call-1", name: "lookup", arguments: { query: "weather" } },
    ]);
    expect(output.finishReason).toBe("tool-call");
  });

  it("throws when responses output text is missing", () => {
    const format = new OpenAIResponsesFormat({ model: "example-model" });

    expect(() =>
      format.parseResponse({
        output: [
          {
            type: "reasoning",
            summary: [{ text: "thought" }],
          },
        ],
      }),
    ).toThrow(LlmIoError);
  });
});
