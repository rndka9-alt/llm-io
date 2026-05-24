import { describe, expect, it } from "vitest";
import { GenericHttpProvider, Llm, LlmIoError, OllamaChatFormat } from "../src/index";
import { createJsonFetch } from "./test-utils";

describe("Ollama chat format", () => {
  it("creates request bodies with options and extra body", () => {
    const format = new OllamaChatFormat({
      extraBody: {
        format: "json",
        keep_alive: "5m",
        think: "low",
      },
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
      format: "json",
      keep_alive: "5m",
      messages: [
        { role: "system", content: "rules" },
        { role: "user", content: "hi" },
      ],
      model: "example-model",
      options: {
        num_predict: 100,
        temperature: 0,
        top_p: 0.8,
      },
      stream: false,
      think: "low",
    });
  });

  it("rejects unsupported Ollama extraBody values at compile time", () => {
    const formatOptions = {
      extraBody: {
        // @ts-expect-error think follows documented Ollama values.
        think: "maximum",
      },
      model: "example-model",
    } satisfies ConstructorParameters<typeof OllamaChatFormat>[0];

    expect(formatOptions.model).toBe("example-model");
  });

  it("normalizes message, thinking, usage, finish reason, and extras", async () => {
    const client = new Llm({
      fetch: createJsonFetch({
        done_reason: "length",
        eval_count: 6,
        message: {
          content: "done",
          thinking: "thought",
        },
        model: "example-model",
        prompt_eval_count: 5,
      }),
      format: new OllamaChatFormat({ model: "example-model" }),
      provider: new GenericHttpProvider({ baseUrl: "https://example.test/api" }),
    });

    const output = await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(output.message.text).toBe("done");
    expect(output.reasoning?.text).toBe("thought");
    expect(output.usage?.inputTokens).toBe(5);
    expect(output.usage?.outputTokens).toBe(6);
    expect(output.usage?.totalTokens).toBe(11);
    expect(output.finishReason).toBe("length");
    expect(output.extras?.model).toBe("example-model");
  });

  it("throws when message content is missing", () => {
    const format = new OllamaChatFormat({ model: "example-model" });

    expect(() =>
      format.parseResponse({
        message: {
          thinking: "thought",
        },
      }),
    ).toThrow(LlmIoError);
  });
});
