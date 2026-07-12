import { describe, expect, it } from "vitest";
import {
  createToolResultMessage,
  GenericHttpProvider,
  Llm,
  LlmIoError,
  OpenAIChatCompletionsFormat,
  OpenAIResponsesFormat,
} from "../src/index";
import {
  createJsonFetch,
  createStreamFetch,
  readRequestBody,
  readStream,
  readTextStream,
} from "./test-utils";

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

  it("places explicit chat completions cache breakpoints on text content", () => {
    const format = new OpenAIChatCompletionsFormat({
      extraBody: {
        prompt_cache_options: { mode: "explicit", ttl: "30m" },
        reasoning_effort: "max",
      },
      model: "example-model",
    });

    expect(
      format.createRequestBody({
        messages: [
          {
            role: "system",
            content: [
              {
                type: "text",
                text: "stable prefix",
                cacheBreakpoint: { mode: "explicit" },
              },
            ],
          },
          { role: "user", content: [{ type: "text", text: "dynamic suffix" }] },
        ],
      }),
    ).toEqual({
      model: "example-model",
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: "stable prefix",
              prompt_cache_breakpoint: { mode: "explicit" },
            },
          ],
        },
        { role: "user", content: "dynamic suffix" },
      ],
      prompt_cache_options: { mode: "explicit", ttl: "30m" },
      reasoning_effort: "max",
    });
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
          prompt_tokens_details: {
            cache_write_tokens: 1,
            cached_tokens: 2,
          },
          completion_tokens: 4,
          completion_tokens_details: {
            reasoning_tokens: 2,
          },
          cost: 0.125,
          cost_details: {
            total_cost: 0.125,
            cached_input_cost: 0.01,
          },
          info: "gateway-cost",
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
    expect(output.usage?.cacheCreationInputTokens).toBe(1);
    expect(output.usage?.cacheReadInputTokens).toBe(2);
    expect(output.usage?.details).toEqual({
      cost: 0.125,
      costDetails: {
        total_cost: 0.125,
        cached_input_cost: 0.01,
      },
      info: "gateway-cost",
    });
    expect(output.usage?.reasoningTokens).toBe(2);
    expect(output.usage?.totalTokens).toBe(7);
    expect(output.raw.choices[0]?.message.content).toBe("hello");
  });

  it("streams chat completions text deltas", async () => {
    const fetchRecorder = createStreamFetch([
      'data: {"choices":[{"index":0,"delta":{"content":"Hel"},"finish_reason":null}],"usage":null}\n',
      '\ndata: {"choices":[{"index":0,"delta":{"content":"lo"},"finish_reason":null}],"usage":null}\n\n',
      'data: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n',
      "data: [DONE]\n\n",
    ]);
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "example-model" }),
      provider: new GenericHttpProvider({ baseUrl: "https://example.test/v1" }),
    });

    const text = await readTextStream(
      client.streamText({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    );

    expect(text).toBe("Hello");
    expect(readRequestBody(fetchRecorder.calls[0]).stream).toBe(true);
  });

  it("streams chat completions cache and cost usage", async () => {
    const fetchRecorder = createStreamFetch([
      'data: {"choices":[{"index":0,"delta":{"content":"ok"},"finish_reason":null}]}\n\n',
      'data: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n',
      'data: {"choices":[],"usage":{"prompt_tokens":3,"completion_tokens":1,"total_tokens":4,"prompt_tokens_details":{"cached_tokens":2,"cache_write_tokens":1},"cost":0.125,"cost_details":{"total_cost":0.125}}}\n\n',
      "data: [DONE]\n\n",
    ]);
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "example-model" }),
      provider: new GenericHttpProvider({ baseUrl: "https://example.test/v1" }),
    });

    const events = await readStream(
      client.stream({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    );
    const usage = {
      cacheCreationInputTokens: 1,
      cacheReadInputTokens: 2,
      inputTokens: 3,
      outputTokens: 1,
      details: { cost: 0.125, costDetails: { total_cost: 0.125 } },
      totalTokens: 4,
    };

    expect(events).toContainEqual({ type: "usage", usage });
    expect(events.at(-1)).toEqual({
      type: "done",
      message: { role: "assistant", content: [{ type: "text", text: "ok" }], text: "ok" },
      usage,
      finishReason: "stop",
    });
  });

  it("streams chat completions tool calls", async () => {
    const fetchRecorder = createStreamFetch([
      'data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":"call-1","type":"function","function":{"name":"lookup","arguments":"{\\"query\\""}}]},"finish_reason":null}]}\n\n',
      'data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":":\\"weather\\"}"}}]},"finish_reason":null}]}\n\n',
      'data: {"choices":[{"index":0,"delta":{},"finish_reason":"tool_calls"}]}\n\n',
      "data: [DONE]\n\n",
    ]);
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "example-model" }),
      provider: new GenericHttpProvider({ baseUrl: "https://example.test/v1" }),
    });

    const events = await readStream(
      client.stream({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    );

    expect(events).toContainEqual({
      type: "tool-call",
      toolCall: { id: "call-1", name: "lookup", arguments: { query: "weather" } },
    });
    expect(events.at(-1)).toEqual({
      type: "done",
      message: {
        role: "assistant",
        content: [
          {
            type: "tool-call",
            id: "call-1",
            name: "lookup",
            arguments: { query: "weather" },
          },
        ],
        text: "",
        toolCalls: [{ id: "call-1", name: "lookup", arguments: { query: "weather" } }],
      },
      toolCalls: [{ id: "call-1", name: "lookup", arguments: { query: "weather" } }],
      finishReason: "tool-call",
    });
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
        prompt_cache_retention: "in-memory",
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
          { type: "web_search", search_context_size: "low" },
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
      prompt_cache_retention: "in-memory",
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
        { type: "web_search", search_context_size: "low" },
      ],
    });
  });

  it("places explicit responses cache breakpoints on input text content", () => {
    const format = new OpenAIResponsesFormat({
      extraBody: {
        prompt_cache_options: { mode: "explicit", ttl: "30m" },
        reasoning: { effort: "max" },
      },
      model: "example-model",
    });

    expect(
      format.createRequestBody({
        messages: [
          {
            role: "system",
            content: [
              {
                type: "text",
                text: "stable prefix",
                cacheBreakpoint: { mode: "explicit" },
              },
            ],
          },
          { role: "user", content: [{ type: "text", text: "dynamic suffix" }] },
        ],
      }),
    ).toEqual({
      model: "example-model",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "stable prefix",
              prompt_cache_breakpoint: { mode: "explicit" },
            },
          ],
        },
        { role: "user", content: "dynamic suffix" },
      ],
      prompt_cache_options: { mode: "explicit", ttl: "30m" },
      reasoning: { effort: "max" },
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

  it("preserves string responses tool results without JSON double encoding", () => {
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
          createToolResultMessage(toolCall, "sunny"),
        ],
      }).input,
    ).toEqual([
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
        output: "sunny",
      },
    ]);
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
            content: [{ type: "reasoning_text", text: "private thought" }],
            summary: [{ type: "summary_text", text: "summary thought" }],
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
    expect(output.reasoning?.text).toBe("private thought\nsummary thought");
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

  it("streams responses text, reasoning, and usage", async () => {
    const fetchRecorder = createStreamFetch([
      'data: {"type":"response.reasoning_summary_text.delta","delta":"think"}\n\n',
      'data: {"type":"response.output_text.delta","delta":"Hel"}\n\n',
      'data: {"type":"response.output_text.delta","delta":"lo"}\n\n',
      'data: {"type":"response.completed","response":{"usage":{"input_tokens":3,"input_tokens_details":{"cached_tokens":2,"cache_write_tokens":1},"output_tokens":4,"total_tokens":7}}}\n\n',
    ]);
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIResponsesFormat({ model: "example-model" }),
      provider: new GenericHttpProvider({ baseUrl: "https://example.test/v1" }),
    });

    const events = await readStream(
      client.stream({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    );

    expect(readRequestBody(fetchRecorder.calls[0]).stream).toBe(true);
    expect(events).toContainEqual({ type: "reasoning-delta", text: "think" });
    expect(events).toContainEqual({ type: "text-delta", text: "Hel" });
    expect(events).toContainEqual({
      type: "usage",
      usage: {
        cacheCreationInputTokens: 1,
        cacheReadInputTokens: 2,
        inputTokens: 3,
        outputTokens: 4,
        totalTokens: 7,
      },
    });
    expect(events.at(-1)).toEqual({
      type: "done",
      message: { role: "assistant", content: [{ type: "text", text: "Hello" }], text: "Hello" },
      reasoning: { text: "think" },
      usage: {
        cacheCreationInputTokens: 1,
        cacheReadInputTokens: 2,
        inputTokens: 3,
        outputTokens: 4,
        totalTokens: 7,
      },
      finishReason: "stop",
    });
  });

  it("streams responses tool calls", async () => {
    const fetchRecorder = createStreamFetch([
      'data: {"type":"response.output_item.added","output_index":0,"item":{"type":"function_call","call_id":"call-1","name":"lookup"}}\n\n',
      'data: {"type":"response.function_call_arguments.delta","output_index":0,"delta":"{\\"query\\""}\n\n',
      'data: {"type":"response.function_call_arguments.delta","output_index":0,"delta":":\\"weather\\"}"}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ]);
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIResponsesFormat({ model: "example-model" }),
      provider: new GenericHttpProvider({ baseUrl: "https://example.test/v1" }),
    });

    const events = await readStream(
      client.stream({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    );

    expect(events).toContainEqual({
      type: "tool-call",
      toolCall: { id: "call-1", name: "lookup", arguments: { query: "weather" } },
    });
    expect(events.at(-1)).toEqual({
      type: "done",
      message: {
        role: "assistant",
        content: [
          {
            type: "tool-call",
            id: "call-1",
            name: "lookup",
            arguments: { query: "weather" },
          },
        ],
        text: "",
        toolCalls: [{ id: "call-1", name: "lookup", arguments: { query: "weather" } }],
      },
      toolCalls: [{ id: "call-1", name: "lookup", arguments: { query: "weather" } }],
      finishReason: "tool-call",
    });
  });

  it("throws when responses output text is missing", () => {
    const format = new OpenAIResponsesFormat({ model: "example-model" });

    expect(() =>
      format.parseResponse({
        output: [
          {
            type: "reasoning",
            summary: [{ type: "summary_text", text: "thought" }],
          },
        ],
      }),
    ).toThrow(LlmIoError);
  });
});
