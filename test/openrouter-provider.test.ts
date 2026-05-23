import { describe, expect, it } from "vitest";
import {
  AnthropicMessagesFormat,
  Llm,
  LlmIoError,
  OpenAIChatCompletionsFormat,
  OpenRouterProvider,
} from "../src/index";
import { createRecordingFetch } from "./test-utils";

describe("OpenRouterProvider", () => {
  it("uses OpenRouter chat completions endpoint and ranking headers", async () => {
    const fetchRecorder = createRecordingFetch({
      choices: [{ message: { content: "ok" } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "openai/gpt-5.2" }),
      provider: new OpenRouterProvider({
        apiKey: "openrouter-key",
        appName: "llm-io",
        siteUrl: "https://example.com",
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(fetchRecorder.calls[0]?.init?.headers).toEqual({
      "content-type": "application/json",
      "HTTP-Referer": "https://example.com",
      "X-OpenRouter-Title": "llm-io",
      authorization: "Bearer openrouter-key",
    });
  });

  it("throws before fetch when format is unsupported", async () => {
    const fetchRecorder = createRecordingFetch({
      content: [{ type: "text", text: "ok" }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({ maxTokens: 1024, model: "claude-example" }),
      provider: new OpenRouterProvider({ apiKey: "openrouter-key" }),
    });

    await expect(
      client.generate({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    ).rejects.toThrow(LlmIoError);
    expect(fetchRecorder.calls).toHaveLength(0);
  });
});
