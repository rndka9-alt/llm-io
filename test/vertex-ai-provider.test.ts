import { describe, expect, it } from "vitest";
import { GeminiGenerateContentFormat, Llm, VertexAIProvider } from "../src/index";
import {
  createGeminiResponse,
  createRecordingFetch,
  createStreamFetch,
  readTextStream,
} from "./test-utils";

describe("VertexAIProvider", () => {
  it("maps Gemini format paths onto Vertex AI publisher model URLs", async () => {
    const fetchRecorder = createRecordingFetch(createGeminiResponse());
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

  it("encodes project, location, and model URL segments", async () => {
    const fetchRecorder = createRecordingFetch(createGeminiResponse());
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

  it("uses the Vertex AI streamGenerateContent endpoint for streaming", async () => {
    const fetchRecorder = createStreamFetch([
      'data: {"candidates":[{"content":{"parts":[{"text":"Hi"}]},"finishReason":"STOP"}]}\n\n',
    ]);
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new GeminiGenerateContentFormat({ model: "gemini-2.5-flash" }),
      provider: new VertexAIProvider({
        accessToken: "vertex-token",
        location: "us-central1",
        projectId: "demo-project",
      }),
    });

    const text = await readTextStream(
      client.streamText({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    );

    expect(text).toBe("Hi");
    expect(fetchRecorder.calls[0]?.input).toBe(
      "https://aiplatform.googleapis.com/v1/projects/demo-project/locations/us-central1/publishers/google/models/gemini-2.5-flash:streamGenerateContent",
    );
  });
});
