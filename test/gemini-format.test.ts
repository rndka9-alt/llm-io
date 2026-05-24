import { describe, expect, it } from "vitest";
import { GeminiGenerateContentFormat, GenericHttpProvider, Llm, LlmIoError } from "../src/index";
import { createJsonFetch } from "./test-utils";

describe("Gemini generateContent format", () => {
  it("creates request bodies with system instructions, model roles, generation config, and extra body", () => {
    const format = new GeminiGenerateContentFormat({
      extraBody: {
        cachedContent: "cachedContents/example",
        generationConfig: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
        },
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }],
      },
      model: "gemini-example",
    });

    expect(
      format.createRequestBody({
        messages: [
          { role: "system", content: [{ type: "text", text: "rules" }] },
          { role: "user", content: [{ type: "text", text: "hi" }] },
          { role: "assistant", content: [{ type: "text", text: "hello" }] },
        ],
        options: {
          maxTokens: 100,
          temperature: 0,
          topP: 0.8,
        },
      }),
    ).toEqual({
      contents: [
        { role: "user", parts: [{ text: "hi" }] },
        { role: "model", parts: [{ text: "hello" }] },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
      cachedContent: "cachedContents/example",
      safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }],
      systemInstruction: {
        parts: [{ text: "rules" }],
      },
    });
  });

  it("rejects unsupported Gemini extraBody values at compile time", () => {
    const formatOptions = {
      extraBody: {
        generationConfig: {
          // @ts-expect-error responseMimeType follows documented Gemini values.
          responseMimeType: "application/xml",
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            // @ts-expect-error threshold follows documented Gemini values.
            threshold: "BLOCK_EVERYTHING",
          },
        ],
      },
      model: "gemini-example",
    } satisfies ConstructorParameters<typeof GeminiGenerateContentFormat>[0];

    expect(formatOptions.model).toBe("gemini-example");
  });

  it("normalizes text, reasoning, usage, and finish reason", async () => {
    const client = new Llm({
      fetch: createJsonFetch({
        candidates: [
          {
            content: {
              parts: [{ text: "thought", thought: true }, { text: "done" }],
            },
            finishReason: "SAFETY",
          },
        ],
        usageMetadata: {
          candidatesTokenCount: 6,
          promptTokenCount: 5,
          thoughtsTokenCount: 2,
          totalTokenCount: 13,
        },
      }),
      format: new GeminiGenerateContentFormat({ model: "gemini-example" }),
      provider: new GenericHttpProvider({ baseUrl: "https://example.test/v1" }),
    });

    const output = await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(output.message.text).toBe("done");
    expect(output.reasoning?.text).toBe("thought");
    expect(output.usage?.inputTokens).toBe(5);
    expect(output.usage?.outputTokens).toBe(6);
    expect(output.usage?.reasoningTokens).toBe(2);
    expect(output.usage?.totalTokens).toBe(13);
    expect(output.finishReason).toBe("content-filter");
  });

  it("throws when response only contains thinking content", () => {
    const format = new GeminiGenerateContentFormat({ model: "gemini-example" });

    expect(() =>
      format.parseResponse({
        candidates: [
          {
            content: {
              parts: [{ text: "thought", thought: true }],
            },
          },
        ],
      }),
    ).toThrow(LlmIoError);
  });
});
