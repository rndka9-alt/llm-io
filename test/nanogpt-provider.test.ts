import { describe, expect, it } from "vitest";
import {
  AnthropicMessagesFormat,
  GeminiGenerateContentFormat,
  Llm,
  LlmIoError,
  NanoGPTProvider,
  OpenAIChatCompletionsFormat,
  OpenAIResponsesFormat,
} from "../src/index";
import { createAnthropicResponse, createRecordingFetch } from "./test-utils";

describe("NanoGPTProvider", () => {
  it("uses NanoGPT OpenAI-compatible chat completions endpoint", async () => {
    const fetchRecorder = createRecordingFetch({
      choices: [{ message: { content: "ok" } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "google/gemini-3-flash-preview" }),
      provider: new NanoGPTProvider({ apiKey: "nanogpt-key" }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://nano-gpt.com/api/v1/chat/completions");
    expect(fetchRecorder.calls[0]?.init?.headers).toEqual({
      "content-type": "application/json",
      authorization: "Bearer nanogpt-key",
    });
  });

  it("uses NanoGPT Anthropic-compatible messages endpoint with x-api-key auth", async () => {
    const fetchRecorder = createRecordingFetch(createAnthropicResponse());
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({
        maxTokens: 1024,
        model: "anthropic/claude-opus-4.6",
      }),
      provider: new NanoGPTProvider({
        apiKey: "nanogpt-key",
        authentication: "x-api-key",
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://nano-gpt.com/api/v1/messages");
    expect(fetchRecorder.calls[0]?.init?.headers).toEqual({
      "content-type": "application/json",
      "x-api-key": "nanogpt-key",
    });
  });

  it("uses NanoGPT OpenAI responses endpoint", async () => {
    const fetchRecorder = createRecordingFetch({
      output: [{ type: "message", content: [{ type: "output_text", text: "ok" }] }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIResponsesFormat({ model: "openai/gpt-5.2" }),
      provider: new NanoGPTProvider({ apiKey: "nanogpt-key" }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://nano-gpt.com/api/v1/responses");
  });

  it("throws before fetch when format is unsupported", async () => {
    const fetchRecorder = createRecordingFetch({
      candidates: [{ content: { parts: [{ text: "ok" }] } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new GeminiGenerateContentFormat({ model: "gemini-2.5-flash" }),
      provider: new NanoGPTProvider({ apiKey: "nanogpt-key" }),
    });

    await expect(
      client.generate({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    ).rejects.toThrow(LlmIoError);
    expect(fetchRecorder.calls).toHaveLength(0);
  });
});
