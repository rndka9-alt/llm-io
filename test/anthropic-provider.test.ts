import { describe, expect, it } from "vitest";
import {
  AnthropicMessagesFormat,
  AnthropicProvider,
  Llm,
  LlmIoError,
  OpenAIChatCompletionsFormat,
} from "../src/index";
import { createAnthropicResponse, createRecordingFetch } from "./test-utils";

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
