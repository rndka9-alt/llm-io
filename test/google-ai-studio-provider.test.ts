import { describe, expect, it } from "vitest";
import { GeminiGenerateContentFormat, GoogleAIStudioProvider, Llm } from "../src/index";
import { createRecordingFetch } from "./test-utils";

describe("GoogleAIStudioProvider", () => {
  it("uses API key query auth with Gemini format", async () => {
    const fetchRecorder = createRecordingFetch(createGeminiResponse());
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

  it("preserves custom headers", async () => {
    const fetchRecorder = createRecordingFetch(createGeminiResponse());
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
});

function createGeminiResponse(): unknown {
  return {
    candidates: [
      {
        content: {
          parts: [{ text: "ok" }],
        },
      },
    ],
  };
}
