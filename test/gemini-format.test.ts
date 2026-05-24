import { describe, expect, it } from "vitest";
import {
  createToolResultMessage,
  GeminiGenerateContentFormat,
  GenericHttpProvider,
  Llm,
  LlmIoError,
} from "../src/index";
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
        toolConfig: { functionCallingConfig: { mode: "AUTO" } },
        tools: [
          {
            functionDeclarations: [
              {
                name: "lookup",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    query: { type: "STRING" },
                  },
                  required: ["query"],
                },
              },
            ],
          },
        ],
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
        maxOutputTokens: 100,
        responseMimeType: "application/json",
        temperature: 0,
        thinkingConfig: { thinkingBudget: 0 },
        topP: 0.8,
      },
      cachedContent: "cachedContents/example",
      safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }],
      systemInstruction: {
        parts: [{ text: "rules" }],
      },
      toolConfig: { functionCallingConfig: { mode: "AUTO" } },
      tools: [
        {
          functionDeclarations: [
            {
              name: "lookup",
              parameters: {
                type: "OBJECT",
                properties: {
                  query: { type: "STRING" },
                },
                required: ["query"],
              },
            },
          ],
        },
      ],
    });
  });

  it("rejects unsupported Gemini extraBody values at compile time", () => {
    const formatOptions = {
      extraBody: {
        generationConfig: {
          // @ts-expect-error responseMimeType follows documented Gemini values.
          responseMimeType: "application/xml",
        },
        tools: [
          {
            functionDeclarations: [
              {
                name: "lookup",
                // @ts-expect-error function parameters must be a Gemini object schema root.
                parameters: { properties: { query: { type: "STRING" } } },
              },
            ],
          },
        ],
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

  it("normalizes function calls without text", async () => {
    const client = new Llm({
      fetch: createJsonFetch({
        candidates: [
          {
            content: {
              parts: [{ functionCall: { name: "lookup", args: { query: "weather" } } }],
            },
            finishReason: "STOP",
          },
        ],
      }),
      format: new GeminiGenerateContentFormat({ model: "gemini-example" }),
      provider: new GenericHttpProvider({ baseUrl: "https://example.test/v1" }),
    });

    const output = await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(output.message.text).toBe("");
    expect(output.toolCalls).toEqual([{ name: "lookup", arguments: { query: "weather" } }]);
    expect(output.message.content).toEqual([
      { type: "tool-call", name: "lookup", arguments: { query: "weather" } },
    ]);
  });

  it("creates function response continuation bodies", () => {
    const format = new GeminiGenerateContentFormat({ model: "gemini-example" });
    const toolCall = { name: "lookup", arguments: { query: "weather" } };

    expect(
      format.createRequestBody({
        messages: [
          { role: "user", content: [{ type: "text", text: "weather?" }] },
          {
            role: "assistant",
            content: [{ type: "tool-call", ...toolCall }],
          },
          createToolResultMessage(toolCall, { temperature: 18 }),
        ],
      }),
    ).toEqual({
      contents: [
        { role: "user", parts: [{ text: "weather?" }] },
        {
          role: "model",
          parts: [{ functionCall: { name: "lookup", args: { query: "weather" } } }],
        },
        {
          role: "user",
          parts: [{ functionResponse: { name: "lookup", response: { temperature: 18 } } }],
        },
      ],
    });
  });

  it("throws when function-call content is not an assistant message", () => {
    const format = new GeminiGenerateContentFormat({ model: "gemini-example" });

    expect(() =>
      format.createRequestBody({
        messages: [
          {
            role: "user",
            content: [{ type: "tool-call", name: "lookup", arguments: {} }],
          },
        ],
      }),
    ).toThrow(LlmIoError);
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
