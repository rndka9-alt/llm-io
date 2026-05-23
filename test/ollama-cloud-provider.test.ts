import { describe, expect, it } from "vitest";
import {
  Llm,
  LlmIoError,
  OllamaChatFormat,
  OllamaCloudProvider,
  OpenAIChatCompletionsFormat,
} from "../src/index.js";
import { createRecordingFetch, readRequestBody } from "./test-utils.js";

describe("OllamaCloudProvider", () => {
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

  it("throws before fetch when it receives an unsupported format", async () => {
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
});
