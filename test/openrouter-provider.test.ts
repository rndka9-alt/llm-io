import { describe, expect, it } from "vitest";
import {
  AnthropicMessagesFormat,
  GeminiGenerateContentFormat,
  Llm,
  LlmIoError,
  OpenAIChatCompletionsFormat,
  OpenAIResponsesFormat,
  OpenRouterProvider,
} from "../src/index";
import {
  createAnthropicResponse,
  createRecordingFetch,
  createStreamFetch,
  readRequestBody,
  readTextStream,
} from "./test-utils";

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

  it("uses OpenRouter responses endpoint", async () => {
    const fetchRecorder = createRecordingFetch({
      output: [{ type: "message", content: [{ type: "output_text", text: "ok" }] }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIResponsesFormat({ model: "openai/gpt-5.2" }),
      provider: new OpenRouterProvider({ apiKey: "openrouter-key" }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://openrouter.ai/api/v1/responses");
  });

  it("uses OpenRouter Anthropic-compatible messages endpoint", async () => {
    const fetchRecorder = createRecordingFetch(createAnthropicResponse());
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({ maxTokens: 1024, model: "claude-example" }),
      provider: new OpenRouterProvider({ apiKey: "openrouter-key" }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://openrouter.ai/api/v1/messages");
  });

  it("streams through OpenRouter OpenAI-compatible endpoint", async () => {
    const fetchRecorder = createStreamFetch([
      'data: {"choices":[{"index":0,"delta":{"content":"ok"},"finish_reason":null}]}\n\n',
      "data: [DONE]\n\n",
    ]);
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "openai/gpt-5.2" }),
      provider: new OpenRouterProvider({ apiKey: "openrouter-key" }),
    });

    const text = await readTextStream(
      client.streamText({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    );

    expect(text).toBe("ok");
    expect(fetchRecorder.calls[0]?.input).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(readRequestBody(fetchRecorder.calls[0]).stream).toBe(true);
  });

  it("throws before fetch when format is unsupported", async () => {
    const fetchRecorder = createRecordingFetch({
      candidates: [{ content: { parts: [{ text: "ok" }] } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new GeminiGenerateContentFormat({ model: "gemini-2.5-flash" }),
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
