import { describe, expect, it } from "vitest";
import {
  GeminiGenerateContentFormat,
  Llm,
  LlmIoError,
  OpenAIChatCompletionsFormat,
  OpenAIProvider,
  OpenAIResponsesFormat,
} from "../src/index.js";
import { createRecordingFetch } from "./test-utils.js";

describe("OpenAIProvider", () => {
  it("uses OpenAI provider defaults with OpenAI-compatible formats", async () => {
    const fetchRecorder = createRecordingFetch({
      choices: [{ message: { content: "ok" } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "gpt-example" }),
      provider: new OpenAIProvider({ apiKey: "openai-key" }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://api.openai.com/v1/chat/completions");
    expect(fetchRecorder.calls[0]?.init?.headers?.authorization).toBe("Bearer openai-key");
  });

  it("uses responses endpoint with custom base URL and headers", async () => {
    const fetchRecorder = createRecordingFetch({
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: "ok" }],
        },
      ],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIResponsesFormat({ model: "response-model" }),
      provider: new OpenAIProvider({
        apiKey: "openai-key",
        baseUrl: "https://openai-proxy.test/root/",
        headers: {
          "x-team": "llm-io",
        },
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://openai-proxy.test/root/responses");
    expect(fetchRecorder.calls[0]?.init?.headers).toEqual({
      "content-type": "application/json",
      "x-team": "llm-io",
      authorization: "Bearer openai-key",
    });
  });

  it("throws before fetch when provider and format are not compatible", async () => {
    const fetchRecorder = createRecordingFetch({
      choices: [{ message: { content: "ok" } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new GeminiGenerateContentFormat({ model: "gemini-2.5-flash" }),
      provider: new OpenAIProvider({ apiKey: "openai-key" }),
    });

    await expect(
      client.generate({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    ).rejects.toThrow(LlmIoError);
    expect(fetchRecorder.calls).toHaveLength(0);
  });
});
