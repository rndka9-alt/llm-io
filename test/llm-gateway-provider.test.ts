import { describe, expect, it } from "vitest";
import {
  AnthropicMessagesFormat,
  GeminiGenerateContentFormat,
  LLMGatewayProvider,
  Llm,
  LlmIoError,
  OpenAIChatCompletionsFormat,
  OpenAIResponsesFormat,
} from "../src/index";
import {
  createAnthropicResponse,
  createRecordingFetch,
  createStreamFetch,
  readRequestBody,
  readTextStream,
} from "./test-utils";

describe("LLMGatewayProvider", () => {
  it("uses the LLM Gateway chat completions endpoint with Bearer auth", async () => {
    const fetchRecorder = createRecordingFetch({
      choices: [{ message: { content: "ok" } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "gpt-5.6-sol" }),
      provider: new LLMGatewayProvider({
        apiKey: "llm-gateway-key",
        headers: { "x-session-id": "conversation-1" },
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://api.llmgateway.io/v1/chat/completions");
    expect(fetchRecorder.calls[0]?.init?.headers).toEqual({
      "content-type": "application/json",
      "x-session-id": "conversation-1",
      authorization: "Bearer llm-gateway-key",
    });
    expect(readRequestBody(fetchRecorder.calls[0])).toEqual({
      model: "gpt-5.6-sol",
      messages: [{ role: "user", content: "hi" }],
    });
  });

  it("uses the Anthropic messages endpoint with a self-hosted base URL", async () => {
    const fetchRecorder = createRecordingFetch(createAnthropicResponse());
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({ maxTokens: 1024, model: "claude-sonnet-4-6" }),
      provider: new LLMGatewayProvider({
        apiKey: "llm-gateway-key",
        baseUrl: "https://llm-gateway.internal/v1/",
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://llm-gateway.internal/v1/messages");
    expect(fetchRecorder.calls[0]?.init?.headers).toEqual({
      "content-type": "application/json",
      authorization: "Bearer llm-gateway-key",
    });
  });

  it("streams through the LLM Gateway chat completions endpoint", async () => {
    const fetchRecorder = createStreamFetch([
      'data: {"choices":[{"index":0,"delta":{"content":"ok"},"finish_reason":null}]}\n\n',
      "data: [DONE]\n\n",
    ]);
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "gpt-5.6-sol" }),
      provider: new LLMGatewayProvider({ apiKey: "llm-gateway-key" }),
    });

    const text = await readTextStream(
      client.streamText({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    );

    expect(text).toBe("ok");
    expect(fetchRecorder.calls[0]?.input).toBe("https://api.llmgateway.io/v1/chat/completions");
    expect(readRequestBody(fetchRecorder.calls[0]).stream).toBe(true);
  });

  it("uses the LLM Gateway responses endpoint", async () => {
    const fetchRecorder = createRecordingFetch({
      output: [{ type: "message", content: [{ type: "output_text", text: "ok" }] }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIResponsesFormat({ model: "gpt-5.6-sol" }),
      provider: new LLMGatewayProvider({ apiKey: "llm-gateway-key" }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://api.llmgateway.io/v1/responses");
  });

  it("streams through the LLM Gateway responses endpoint", async () => {
    const fetchRecorder = createStreamFetch([
      'data: {"type":"response.output_text.delta","delta":"ok"}\n\n',
      'data: {"type":"response.completed","response":{}}\n\n',
    ]);
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIResponsesFormat({ model: "gpt-5.6-sol" }),
      provider: new LLMGatewayProvider({ apiKey: "llm-gateway-key" }),
    });

    const text = await readTextStream(
      client.streamText({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    );

    expect(text).toBe("ok");
    expect(fetchRecorder.calls[0]?.input).toBe("https://api.llmgateway.io/v1/responses");
    expect(readRequestBody(fetchRecorder.calls[0]).stream).toBe(true);
  });

  it("throws before fetch when format is unsupported", async () => {
    const fetchRecorder = createRecordingFetch({
      candidates: [{ content: { parts: [{ text: "ok" }] } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new GeminiGenerateContentFormat({ model: "gemini-2.5-flash" }),
      provider: new LLMGatewayProvider({ apiKey: "llm-gateway-key" }),
    });

    await expect(
      client.generate({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    ).rejects.toThrow(LlmIoError);
    expect(fetchRecorder.calls).toHaveLength(0);
  });
});
