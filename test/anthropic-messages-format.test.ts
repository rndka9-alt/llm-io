import { describe, expect, it } from "vitest";
import { AnthropicMessagesFormat, createToolResultMessage, Llm, LlmIoError } from "../src/index";
import { createAnthropicResponse, createRecordingFetch, readRequestBody } from "./test-utils";

describe("AnthropicMessagesFormat", () => {
  it("creates Anthropic messages request bodies with system extraction and role merging", async () => {
    const fetchRecorder = createRecordingFetch(createAnthropicResponse());
    const client = new Llm({
      baseUrl: "https://api.anthropic.com/v1",
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({
        extraBody: {
          service_tier: "auto",
          stop_sequences: ["END"],
          thinking: { budget_tokens: 1024, display: "summarized", type: "enabled" },
          tool_choice: { type: "auto" },
          tools: [
            {
              cache_control: { ttl: "5m", type: "ephemeral" },
              input_schema: {
                type: "object",
                properties: {
                  query: { type: "string" },
                },
                required: ["query"],
              },
              name: "lookup",
            },
          ],
        },
        maxTokens: 1024,
        model: "claude-example",
      }),
    });

    await client.generate({
      messages: [
        { role: "system", content: [{ type: "text", text: "Act carefully." }] },
        { role: "user", content: [{ type: "text", text: "Hi" }] },
        { role: "assistant", content: [{ type: "text", text: "Hello" }] },
        { role: "system", content: [{ type: "text", text: "Use short answers." }] },
        { role: "user", content: [{ type: "text", text: "Next" }] },
      ],
      options: {
        maxTokens: 256,
        temperature: 0.3,
        topP: 0.9,
      },
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://api.anthropic.com/v1/messages");
    expect(readRequestBody(fetchRecorder.calls[0])).toEqual({
      max_tokens: 256,
      messages: [
        { role: "user", content: [{ type: "text", text: "Hi" }] },
        { role: "assistant", content: [{ type: "text", text: "Hello" }] },
        {
          role: "user",
          content: [{ type: "text", text: "System: Use short answers.\n\nNext" }],
        },
      ],
      model: "claude-example",
      service_tier: "auto",
      system: "Act carefully.",
      stop_sequences: ["END"],
      temperature: 0.3,
      thinking: { budget_tokens: 1024, display: "summarized", type: "enabled" },
      tool_choice: { type: "auto" },
      tools: [
        {
          cache_control: { ttl: "5m", type: "ephemeral" },
          input_schema: {
            type: "object",
            properties: {
              query: { type: "string" },
            },
            required: ["query"],
          },
          name: "lookup",
        },
      ],
      top_p: 0.9,
    });
  });

  it("rejects unsupported Anthropic extraBody values at compile time", () => {
    const formatOptions = {
      extraBody: {
        // @ts-expect-error service_tier follows documented Anthropic values.
        service_tier: "priority",
        thinking: { display: "omitted", type: "adaptive" },
        // @ts-expect-error thinking display follows documented Anthropic values.
        thinking_display: { display: "hidden", type: "adaptive" },
        tools: [
          {
            name: "lookup",
            // @ts-expect-error tool input_schema must be a JSON Schema object root.
            input_schema: { properties: { query: { type: "string" } } },
          },
        ],
      },
      maxTokens: 1024,
      model: "claude-example",
    } satisfies ConstructorParameters<typeof AnthropicMessagesFormat>[0];

    expect(formatOptions.model).toBe("claude-example");
  });

  it("adds a starter user message when Anthropic would otherwise receive no user turn", async () => {
    const fetchRecorder = createRecordingFetch(createAnthropicResponse());
    const client = new Llm({
      baseUrl: "https://api.anthropic.com/v1",
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({
        maxTokens: 1024,
        model: "claude-example",
      }),
    });

    await client.generate({
      messages: [{ role: "system", content: [{ type: "text", text: "Only system." }] }],
    });

    expect(readRequestBody(fetchRecorder.calls[0]).messages).toEqual([
      { role: "user", content: [{ type: "text", text: "Start" }] },
    ]);
    expect(readRequestBody(fetchRecorder.calls[0]).system).toBe("Only system.");
  });

  it("parses text, thinking, redacted thinking, usage, and finish reason", async () => {
    const fetchRecorder = createRecordingFetch({
      content: [
        { type: "thinking", thinking: "Plan first." },
        { type: "thinking", thinking: "Keep signature.", signature: "sig-1" },
        { type: "redacted_thinking", data: "redacted-1" },
        { type: "text", text: "Done." },
      ],
      stop_reason: "max_tokens",
      usage: {
        cache_creation_input_tokens: 2,
        cache_read_input_tokens: 3,
        input_tokens: 11,
        output_tokens: 7,
        server_tool_use: {
          web_search_requests: 1,
        },
      },
    });
    const client = new Llm({
      baseUrl: "https://api.anthropic.com/v1",
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({
        maxTokens: 1024,
        model: "claude-example",
      }),
    });

    const output = await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
    });

    expect(output.message.text).toBe("Done.");
    expect(output.message.content).toEqual([
      { type: "thinking", thinking: "Plan first." },
      { type: "thinking", thinking: "Keep signature.", signature: "sig-1" },
      { type: "redacted-thinking", data: "redacted-1" },
      { type: "text", text: "Done." },
    ]);
    expect(output.reasoning?.text).toBe("Plan first.\nKeep signature.\n{{redacted_thinking}}");
    expect(output.usage).toEqual({
      cacheCreationInputTokens: 2,
      cacheReadInputTokens: 3,
      inputTokens: 16,
      outputTokens: 7,
      details: { serverToolUse: { web_search_requests: 1 } },
      totalTokens: 23,
    });
    expect(output.finishReason).toBe("length");
  });

  it("normalizes model context window stop reason as length", () => {
    const format = new AnthropicMessagesFormat({
      maxTokens: 1024,
      model: "claude-example",
    });

    const output = format.parseResponse({
      content: [{ type: "text", text: "Done." }],
      stop_reason: "model_context_window_exceeded",
    });

    expect(output.finishReason).toBe("length");
  });

  it("parses tool_use blocks without text", async () => {
    const fetchRecorder = createRecordingFetch({
      content: [
        {
          type: "tool_use",
          id: "toolu-1",
          name: "lookup",
          input: { query: "weather" },
        },
      ],
      stop_reason: "tool_use",
    });
    const client = new Llm({
      baseUrl: "https://api.anthropic.com/v1",
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({
        maxTokens: 1024,
        model: "claude-example",
      }),
    });

    const output = await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
    });

    expect(output.message.text).toBe("");
    expect(output.toolCalls).toEqual([
      { id: "toolu-1", name: "lookup", arguments: { query: "weather" } },
    ]);
    expect(output.message.content).toEqual([
      { type: "tool-call", id: "toolu-1", name: "lookup", arguments: { query: "weather" } },
    ]);
    expect(output.finishReason).toBe("tool-call");
  });

  it("creates tool result continuation bodies", () => {
    const format = new AnthropicMessagesFormat({
      maxTokens: 1024,
      model: "claude-example",
    });
    const toolCall = { id: "toolu-1", name: "lookup", arguments: { query: "weather" } };

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
      max_tokens: 1024,
      model: "claude-example",
      messages: [
        { role: "user", content: [{ type: "text", text: "weather?" }] },
        {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              id: "toolu-1",
              name: "lookup",
              input: { query: "weather" },
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "toolu-1",
              content: '{"temperature":18}',
            },
          ],
        },
      ],
    });
  });

  it("preserves Anthropic tool result content blocks", () => {
    const format = new AnthropicMessagesFormat({
      maxTokens: 1024,
      model: "claude-example",
    });
    const toolCall = { id: "toolu-1", name: "lookup", arguments: { query: "weather" } };

    expect(
      format.createRequestBody({
        messages: [
          { role: "user", content: [{ type: "text", text: "weather?" }] },
          {
            role: "assistant",
            content: [{ type: "tool-call", ...toolCall }],
          },
          createToolResultMessage(toolCall, [{ type: "text", text: "sunny" }]),
        ],
      }).messages,
    ).toEqual([
      { role: "user", content: [{ type: "text", text: "weather?" }] },
      {
        role: "assistant",
        content: [
          {
            type: "tool_use",
            id: "toolu-1",
            name: "lookup",
            input: { query: "weather" },
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: "toolu-1",
            content: [{ type: "text", text: "sunny" }],
          },
        ],
      },
    ]);
  });

  it("creates image, document, search result, and thinking continuation bodies", () => {
    const format = new AnthropicMessagesFormat({
      maxTokens: 1024,
      model: "claude-example",
    });

    expect(
      format.createRequestBody({
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "url", url: "https://example.test/chart.png" } },
              {
                type: "document",
                source: {
                  type: "text",
                  media_type: "text/plain",
                  data: "Document text",
                },
                citations: { enabled: true },
              },
              {
                type: "search-result",
                source: "https://example.test/doc",
                title: "Example doc",
                content: [{ type: "text", text: "Search result text" }],
                citations: { enabled: true },
              },
              { type: "text", text: "Summarize these." },
            ],
          },
          {
            role: "assistant",
            content: [
              { type: "thinking", thinking: "Need cite.", signature: "sig-1" },
              { type: "redacted-thinking", data: "opaque" },
              { type: "text", text: "Summary" },
            ],
          },
        ],
      }),
    ).toEqual({
      max_tokens: 1024,
      model: "claude-example",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "url", url: "https://example.test/chart.png" } },
            {
              type: "document",
              source: {
                type: "text",
                media_type: "text/plain",
                data: "Document text",
              },
              citations: { enabled: true },
            },
            {
              type: "search_result",
              source: "https://example.test/doc",
              title: "Example doc",
              content: [{ type: "text", text: "Search result text" }],
              citations: { enabled: true },
            },
            { type: "text", text: "Summarize these." },
          ],
        },
        {
          role: "assistant",
          content: [
            { type: "thinking", thinking: "Need cite.", signature: "sig-1" },
            { type: "redacted_thinking", data: "opaque" },
            { type: "text", text: "Summary" },
          ],
        },
      ],
    });
  });

  it("throws when tool_use content is not an assistant message", () => {
    const format = new AnthropicMessagesFormat({
      maxTokens: 1024,
      model: "claude-example",
    });

    expect(() =>
      format.createRequestBody({
        messages: [
          {
            role: "user",
            content: [{ type: "tool-call", id: "toolu-1", name: "lookup", arguments: {} }],
          },
        ],
      }),
    ).toThrow(LlmIoError);
  });

  it("throws when Anthropic search_result title is missing", () => {
    const format = new AnthropicMessagesFormat({
      maxTokens: 1024,
      model: "claude-example",
    });

    expect(() =>
      format.createRequestBody({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "search-result",
                source: "https://example.test/doc",
                content: [{ type: "text", text: "Search result text" }],
              },
            ],
          },
        ],
      }),
    ).toThrow(LlmIoError);
  });

  it("throws when Anthropic response has no text content", async () => {
    const fetchRecorder = createRecordingFetch({
      content: [{ type: "thinking", thinking: "No visible answer." }],
    });
    const client = new Llm({
      baseUrl: "https://api.anthropic.com/v1",
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({
        maxTokens: 1024,
        model: "claude-example",
      }),
    });

    await expect(
      client.generate({
        messages: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
      }),
    ).rejects.toThrow(LlmIoError);
  });
});
