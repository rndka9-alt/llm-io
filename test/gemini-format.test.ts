import { describe, expect, it } from "vitest";
import {
  createToolResultMessage,
  GeminiGenerateContentFormat,
  GenericHttpProvider,
  GoogleAIStudioProvider,
  Llm,
  LlmIoError,
} from "../src/index";
import { createJsonFetch, createStreamFetch, readRequestBody, readStream } from "./test-utils";

describe("Gemini generateContent format", () => {
  it("creates request bodies with system instructions, model roles, generation config, and extra body", () => {
    const format = new GeminiGenerateContentFormat({
      extraBody: {
        cachedContent: "cachedContents/example",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: { type: "OBJECT", properties: { ok: { type: "BOOLEAN" } } },
          mediaResolution: "MEDIA_RESOLUTION_ULTRA_HIGH",
          thinkingConfig: { thinkingBudget: 0, thinkingLevel: "LOW" },
        },
        labels: { team: "llm-io" },
        modelArmorConfig: { templateName: "projects/p/locations/l/templates/t" },
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }],
        serviceTier: "flex",
        store: true,
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
        responseSchema: { type: "OBJECT", properties: { ok: { type: "BOOLEAN" } } },
        mediaResolution: "MEDIA_RESOLUTION_ULTRA_HIGH",
        temperature: 0,
        thinkingConfig: { thinkingBudget: 0, thinkingLevel: "LOW" },
        topP: 0.8,
      },
      cachedContent: "cachedContents/example",
      labels: { team: "llm-io" },
      modelArmorConfig: { templateName: "projects/p/locations/l/templates/t" },
      safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }],
      serviceTier: "flex",
      store: true,
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
          // @ts-expect-error responseSchema must include a Gemini schema or JSON Schema root object.
          responseSchema: { properties: { ok: { type: "BOOLEAN" } } },
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
            finishReason: "FINISH_REASON_PROHIBITED_CONTENT",
          },
        ],
        usageMetadata: {
          cachedContentTokenCount: 4,
          candidatesTokenCount: 6,
          candidatesTokensDetails: [{ modality: "TEXT", tokenCount: 6 }],
          promptTokensDetails: [{ modality: "TEXT", tokenCount: 5 }],
          promptTokenCount: 5,
          thoughtsTokenCount: 2,
          toolUsePromptTokenCount: 1,
          trafficType: "ON_DEMAND",
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
    expect(output.usage?.cacheReadInputTokens).toBe(4);
    expect(output.usage?.inputTokens).toBe(5);
    expect(output.usage?.outputTokens).toBe(6);
    expect(output.usage?.reasoningTokens).toBe(2);
    expect(output.usage?.totalTokens).toBe(13);
    expect(output.usage?.details).toEqual({
      candidatesTokensDetails: [{ modality: "TEXT", tokenCount: 6 }],
      promptTokensDetails: [{ modality: "TEXT", tokenCount: 5 }],
      toolUsePromptTokenCount: 1,
      trafficType: "ON_DEMAND",
    });
    expect(output.finishReason).toBe("content-filter");
  });

  it("normalizes function calls without text", async () => {
    const client = new Llm({
      fetch: createJsonFetch({
        candidates: [
          {
            content: {
              parts: [
                { functionCall: { id: "call-1", name: "lookup", args: { query: "weather" } } },
              ],
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
    expect(output.toolCalls).toEqual([
      { id: "call-1", name: "lookup", arguments: { query: "weather" } },
    ]);
    expect(output.message.content).toEqual([
      { type: "tool-call", id: "call-1", name: "lookup", arguments: { query: "weather" } },
    ]);
  });

  it("streams text, reasoning, tool calls, usage, and finish reason", async () => {
    const fetchRecorder = createStreamFetch([
      'data: {"candidates":[{"content":{"parts":[{"text":"think","thought":true},{"text":"Hi"}]}}]}\n\n',
      'data: {"candidates":[{"content":{"parts":[{"functionCall":{"id":"call-1","name":"lookup","args":{"query":"weather"}}}]},"finishReason":"STOP"}],"usageMetadata":{"promptTokenCount":5,"candidatesTokenCount":6,"totalTokenCount":11}}\n\n',
    ]);
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new GeminiGenerateContentFormat({ model: "gemini-example" }),
      provider: new GoogleAIStudioProvider({ apiKey: "key" }),
    });

    const events = await readStream(
      client.stream({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      }),
    );

    expect(fetchRecorder.calls[0]?.input).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-example:streamGenerateContent?key=key",
    );
    expect(readRequestBody(fetchRecorder.calls[0]).contents).toEqual([
      { role: "user", parts: [{ text: "hi" }] },
    ]);
    expect(events).toContainEqual({ type: "reasoning-delta", text: "think" });
    expect(events).toContainEqual({ type: "text-delta", text: "Hi" });
    expect(events).toContainEqual({
      type: "usage",
      usage: { inputTokens: 5, outputTokens: 6, totalTokens: 11 },
    });
    expect(events).toContainEqual({
      type: "tool-call",
      toolCall: { id: "call-1", name: "lookup", arguments: { query: "weather" } },
    });
    expect(events.at(-1)).toEqual({
      type: "done",
      message: {
        role: "assistant",
        content: [
          { type: "text", text: "Hi" },
          { type: "tool-call", id: "call-1", name: "lookup", arguments: { query: "weather" } },
        ],
        text: "Hi",
        toolCalls: [{ id: "call-1", name: "lookup", arguments: { query: "weather" } }],
      },
      reasoning: { text: "think" },
      toolCalls: [{ id: "call-1", name: "lookup", arguments: { query: "weather" } }],
      usage: { inputTokens: 5, outputTokens: 6, totalTokens: 11 },
      finishReason: "stop",
    });
  });

  it("creates function response continuation bodies", () => {
    const format = new GeminiGenerateContentFormat({ model: "gemini-example" });
    const toolCall = { id: "call-1", name: "lookup", arguments: { query: "weather" } };

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
          parts: [{ functionCall: { id: "call-1", name: "lookup", args: { query: "weather" } } }],
        },
        {
          role: "user",
          parts: [
            { functionResponse: { id: "call-1", name: "lookup", response: { temperature: 18 } } },
          ],
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
