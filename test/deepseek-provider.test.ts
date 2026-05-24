import { describe, expect, it } from "vitest";
import {
  AnthropicMessagesFormat,
  DeepSeekProvider,
  GeminiGenerateContentFormat,
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

describe("DeepSeekProvider", () => {
  it("uses DeepSeek OpenAI-compatible chat completions endpoint", async () => {
    const fetchRecorder = createRecordingFetch({
      choices: [{ message: { content: "ok" } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "deepseek-v4-pro" }),
      provider: new DeepSeekProvider({ apiKey: "deepseek-key" }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://api.deepseek.com/chat/completions");
    expect(fetchRecorder.calls[0]?.init?.headers).toEqual({
      "content-type": "application/json",
      authorization: "Bearer deepseek-key",
    });
  });

  it("uses DeepSeek Anthropic-compatible messages endpoint", async () => {
    const fetchRecorder = createRecordingFetch(createAnthropicResponse());
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({
        maxTokens: 1024,
        model: "deepseek-v4-pro",
      }),
      provider: new DeepSeekProvider({ apiKey: "deepseek-key" }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://api.deepseek.com/anthropic/messages");
    expect(fetchRecorder.calls[0]?.init?.headers).toEqual({
      "content-type": "application/json",
      "x-api-key": "deepseek-key",
      "anthropic-version": "2023-06-01",
    });
  });

  it("streams through DeepSeek OpenAI-compatible endpoint", async () => {
    const fetchRecorder = createStreamFetch([
      'data: {"choices":[{"index":0,"delta":{"content":"ok"},"finish_reason":null}]}\n\n',
      "data: [DONE]\n\n",
    ]);
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "deepseek-v4-pro" }),
      provider: new DeepSeekProvider({ apiKey: "deepseek-key" }),
    });

    const text = await readTextStream(
      client.streamText({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    );

    expect(text).toBe("ok");
    expect(fetchRecorder.calls[0]?.input).toBe("https://api.deepseek.com/chat/completions");
    expect(readRequestBody(fetchRecorder.calls[0]).stream).toBe(true);
  });

  it("throws before fetch when format is unsupported", async () => {
    const fetchRecorder = createRecordingFetch({
      candidates: [{ content: { parts: [{ text: "ok" }] } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new GeminiGenerateContentFormat({ model: "gemini-2.5-flash" }),
      provider: new DeepSeekProvider({ apiKey: "deepseek-key" }),
    });

    await expect(
      client.generate({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    ).rejects.toThrow(LlmIoError);
    expect(fetchRecorder.calls).toHaveLength(0);
  });
});
