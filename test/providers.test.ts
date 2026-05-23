import { describe, expect, it } from "vitest";
import {
  GeminiGenerateContentFormat,
  GoogleAIStudioProvider,
  Llm,
  OllamaChatFormat,
  OllamaCloudProvider,
  OpenAIChatCompletionsFormat,
  OpenAIProvider,
  VercelAIGatewayProvider,
  VertexAIProvider,
} from "../src/index.js";
import type { FetchLike } from "../src/index.js";

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
});

interface FetchCall {
  input: string;
  init?: Parameters<FetchLike>[1];
}

function createRecordingFetch(responseJson: unknown): { calls: FetchCall[]; fetch: FetchLike } {
  const calls: FetchCall[] = [];

  return {
    calls,
    fetch: async (input, init) => {
      calls.push(init === undefined ? { input } : { input, init });

      return {
        ok: true,
        status: 200,
        statusText: "OK",
        async json() {
          return responseJson;
        },
        async text() {
          return JSON.stringify(responseJson);
        },
      };
    },
  };
}

function readRequestBody(call: FetchCall | undefined): Record<string, unknown> {
  if (call?.init?.body === undefined) {
    throw new Error("Expected request body.");
  }

  const parsed = JSON.parse(call.init.body);

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Expected object request body.");
  }

  return parsed;
}
