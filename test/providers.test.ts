import { describe, expect, it } from "vitest";
import {
  GeminiGenerateContentFormat,
  GenericHttpProvider,
  GoogleAIStudioProvider,
  Llm,
  LlmIoError,
  OllamaChatFormat,
  OllamaCloudProvider,
  OpenAIChatCompletionsFormat,
  OpenAIProvider,
  OpenAIResponsesFormat,
  VercelAIGatewayProvider,
  VertexAIProvider,
} from "../src/index.js";
import { createRecordingFetch, readRequestBody } from "./test-utils.js";

describe("providers", () => {
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

  it("uses OpenAI responses endpoint with custom base URL and headers", async () => {
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

  it("throws when provider and format are not compatible", async () => {
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

  it("injects Vercel AI Gateway providerOptions into OpenAI-compatible bodies", async () => {
    const fetchRecorder = createRecordingFetch({
      choices: [{ message: { content: "ok" } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "openai/gpt-5.1" }),
      provider: new VercelAIGatewayProvider({
        apiKey: "gateway-key",
        providerOptions: {
          gateway: {
            only: ["openai"],
          },
        },
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://ai-gateway.vercel.sh/v1/chat/completions");
    expect(readRequestBody(fetchRecorder.calls[0]).providerOptions).toEqual({
      gateway: {
        only: ["openai"],
      },
    });
  });

  it("uses Vercel AI Gateway responses endpoint", async () => {
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
      format: new OpenAIResponsesFormat({ model: "openai/gpt-5.1" }),
      provider: new VercelAIGatewayProvider({ apiKey: "gateway-key" }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://ai-gateway.vercel.sh/v1/responses");
  });

  it("uses Google AI Studio API key query auth with Gemini format", async () => {
    const fetchRecorder = createRecordingFetch({
      candidates: [
        {
          content: {
            parts: [{ text: "ok" }],
          },
        },
      ],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new GeminiGenerateContentFormat({ model: "gemini-2.5-flash" }),
      provider: new GoogleAIStudioProvider({ apiKey: "studio-key" }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=studio-key",
    );
  });

  it("preserves Google AI Studio custom headers", async () => {
    const fetchRecorder = createRecordingFetch({
      candidates: [
        {
          content: {
            parts: [{ text: "ok" }],
          },
        },
      ],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new GeminiGenerateContentFormat({ model: "gemini-2.5-flash" }),
      provider: new GoogleAIStudioProvider({
        apiKey: "studio-key",
        headers: {
          "x-goog-user-project": "billing-project",
        },
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.init?.headers).toEqual({
      "content-type": "application/json",
      "x-goog-user-project": "billing-project",
    });
  });

  it("maps Gemini format paths onto Vertex AI publisher model URLs", async () => {
    const fetchRecorder = createRecordingFetch({
      candidates: [
        {
          content: {
            parts: [{ text: "ok" }],
          },
        },
      ],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new GeminiGenerateContentFormat({ model: "gemini-2.5-flash" }),
      provider: new VertexAIProvider({
        accessToken: "vertex-token",
        location: "us-central1",
        projectId: "demo-project",
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe(
      "https://aiplatform.googleapis.com/v1/projects/demo-project/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent",
    );
    expect(fetchRecorder.calls[0]?.init?.headers?.authorization).toBe("Bearer vertex-token");
  });

  it("encodes Vertex AI project, location, and model URL segments", async () => {
    const fetchRecorder = createRecordingFetch({
      candidates: [
        {
          content: {
            parts: [{ text: "ok" }],
          },
        },
      ],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new GeminiGenerateContentFormat({ model: "model/with space" }),
      provider: new VertexAIProvider({
        accessToken: "vertex-token",
        location: "asia north",
        projectId: "demo/project",
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe(
      "https://aiplatform.googleapis.com/v1/projects/demo%2Fproject/locations/asia%20north/publishers/google/models/model%2Fwith%20space:generateContent",
    );
  });

  it("uses Ollama Cloud base URL with Ollama chat format", async () => {
    const fetchRecorder = createRecordingFetch({
      message: {
        content: "ok",
      },
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OllamaChatFormat({ model: "gpt-oss:120b-cloud" }),
      provider: new OllamaCloudProvider({ apiKey: "ollama-key" }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://ollama.com/api/chat");
    expect(readRequestBody(fetchRecorder.calls[0]).model).toBe("gpt-oss:120b-cloud");
  });

  it("throws before fetch when Ollama Cloud receives an unsupported format", async () => {
    const fetchRecorder = createRecordingFetch({
      message: {
        content: "ok",
      },
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "gpt-example" }),
      provider: new OllamaCloudProvider({ apiKey: "ollama-key" }),
    });

    await expect(
      client.generate({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    ).rejects.toThrow(LlmIoError);
    expect(fetchRecorder.calls).toHaveLength(0);
  });

  it("uses Generic HTTP custom request path resolver", async () => {
    const fetchRecorder = createRecordingFetch({
      choices: [{ message: { content: "ok" } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "gpt-example" }),
      provider: new GenericHttpProvider({
        baseUrl: "https://generic.test/root/",
        resolveRequestPath: (format) => `custom/${format.id}`,
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe(
      "https://generic.test/root/custom/openai-chat-completions",
    );
  });
});
