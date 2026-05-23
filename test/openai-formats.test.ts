import { describe, expect, it } from "vitest";
import {
  GenericHttpProvider,
  Llm,
  LlmIoError,
  OpenAIChatCompletionsFormat,
  OpenAIResponsesFormat,
} from "../src/index.js";
import { createJsonFetch } from "./test-utils.js";

describe("OpenAI formats", () => {
  it("creates chat completions request bodies", () => {
    const format = new OpenAIChatCompletionsFormat({
      extraBody: { response_format: { type: "json_object" } },
      model: "example-model",
    });

    expect(
      format.createRequestBody({
        messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
        options: {
          maxTokens: 100,
          temperature: 0,
          topP: 0.8,
        },
      }),
    ).toEqual({
      model: "example-model",
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 100,
      temperature: 0,
      top_p: 0.8,
      response_format: { type: "json_object" },
    });
  });

  it("normalizes chat completions output", async () => {
    const client = new Llm({
      fetch: createJsonFetch({
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: "hello",
              reasoning_content: "because",
            },
          },
        ],
        usage: {
          prompt_tokens: 3,
          completion_tokens: 4,
          total_tokens: 7,
        },
      }),
      format: new OpenAIChatCompletionsFormat({ model: "example-model" }),
      provider: new GenericHttpProvider({ baseUrl: "https://example.test/v1" }),
    });

    const output = await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(output.message.text).toBe("hello");
    expect(output.reasoning?.text).toBe("because");
    expect(output.usage?.totalTokens).toBe(7);
    expect(output.raw.choices[0]?.message.content).toBe("hello");
  });

  it("throws when chat completions output text is missing", () => {
    const format = new OpenAIChatCompletionsFormat({ model: "example-model" });

    expect(() =>
      format.parseResponse({
        choices: [
          {
            message: {
              content: "",
            },
          },
        ],
      }),
    ).toThrow(LlmIoError);
  });

  it("creates responses request bodies", () => {
    const format = new OpenAIResponsesFormat({
      extraBody: { store: false },
      model: "example-model",
    });

    expect(
      format.createRequestBody({
        messages: [
          { role: "system", content: [{ type: "text", text: "rules" }] },
          { role: "user", content: [{ type: "text", text: "hi" }] },
        ],
        options: {
          maxTokens: 100,
          temperature: 0,
          topP: 0.8,
        },
      }),
    ).toEqual({
      model: "example-model",
      input: [
        { role: "system", content: "rules" },
        { role: "user", content: "hi" },
      ],
      max_output_tokens: 100,
      temperature: 0,
      top_p: 0.8,
      store: false,
    });
  });

  it("normalizes responses output and keeps typed extras", async () => {
    const client = new Llm({
      fetch: createJsonFetch({
        id: "response-1",
        output: [
          {
            type: "reasoning",
            summary: [{ text: "thought" }],
          },
          {
            type: "message",
            content: [{ type: "output_text", text: "done" }],
          },
        ],
        usage: {
          input_tokens: 5,
          output_tokens: 6,
          output_tokens_details: {
            reasoning_tokens: 2,
          },
          total_tokens: 11,
        },
      }),
      format: new OpenAIResponsesFormat({ model: "example-model" }),
      provider: new GenericHttpProvider({ baseUrl: "https://example.test/v1" }),
    });

    const output = await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(output.message.text).toBe("done");
    expect(output.reasoning?.text).toBe("thought");
    expect(output.usage?.reasoningTokens).toBe(2);
    expect(output.raw.output).toHaveLength(2);
    expect(output.extras?.responseId).toBe("response-1");
  });

  it("throws when responses output text is missing", () => {
    const format = new OpenAIResponsesFormat({ model: "example-model" });

    expect(() =>
      format.parseResponse({
        output: [
          {
            type: "reasoning",
            summary: [{ text: "thought" }],
          },
        ],
      }),
    ).toThrow(LlmIoError);
  });
});
