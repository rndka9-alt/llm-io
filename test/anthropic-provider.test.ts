import { describe, expect, it } from "vitest";
import {
  AnthropicMessagesFormat,
  AnthropicProvider,
  Llm,
  LlmIoError,
  OpenAIChatCompletionsFormat,
} from "../src/index";
import {
  createAnthropicResponse,
  createRecordingFetch,
  createStreamFetch,
  readRequestBody,
  readTextStream,
} from "./test-utils";

describe("AnthropicProvider", () => {
  it("uses Anthropic messages endpoint and headers", async () => {
    const fetchRecorder = createRecordingFetch(createAnthropicResponse());
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({
        maxTokens: 1024,
        model: "claude-example",
      }),
      provider: new AnthropicProvider({
        apiKey: "anthropic-key",
        headers: {
          "anthropic-beta": "example-beta",
        },
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://api.anthropic.com/v1/messages");
    expect(fetchRecorder.calls[0]?.init?.headers).toEqual({
      "content-type": "application/json",
      "anthropic-beta": "example-beta",
      "x-api-key": "anthropic-key",
      "anthropic-version": "2023-06-01",
    });
  });

  it("supports custom base URL and Anthropic API version", async () => {
    const fetchRecorder = createRecordingFetch(createAnthropicResponse());
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({
        maxTokens: 1024,
        model: "claude-example",
      }),
      provider: new AnthropicProvider({
        anthropicVersion: "2024-01-01",
        baseUrl: "https://proxy.example/v1",
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://proxy.example/v1/messages");
    expect(fetchRecorder.calls[0]?.init?.headers?.["anthropic-version"]).toBe("2024-01-01");
  });

  it("streams through Anthropic messages endpoint", async () => {
    const fetchRecorder = createStreamFetch([
      'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hi"}}\n\n',
    ]);
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({
        maxTokens: 1024,
        model: "claude-example",
      }),
      provider: new AnthropicProvider({
        apiKey: "anthropic-key",
      }),
    });

    const text = await readTextStream(
      client.streamText({
        messages: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
      }),
    );

    expect(text).toBe("Hi");
    expect(fetchRecorder.calls[0]?.input).toBe("https://api.anthropic.com/v1/messages");
    expect(readRequestBody(fetchRecorder.calls[0]).stream).toBe(true);
  });

  it("throws for non-Anthropic formats", async () => {
    const fetchRecorder = createRecordingFetch({
      choices: [{ message: { content: "ok" } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "gpt-example" }),
      provider: new AnthropicProvider({
        apiKey: "anthropic-key",
      }),
    });

    await expect(
      client.generate({
        messages: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
      }),
    ).rejects.toThrow(LlmIoError);
    expect(fetchRecorder.calls).toEqual([]);
  });
});
