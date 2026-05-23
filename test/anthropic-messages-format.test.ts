import { describe, expect, it } from "vitest";
import { AnthropicMessagesFormat, Llm, LlmIoError } from "../src/index";
import { createAnthropicResponse, createRecordingFetch, readRequestBody } from "./test-utils";

describe("AnthropicMessagesFormat", () => {
  it("creates Anthropic messages request bodies with system extraction and role merging", async () => {
    const fetchRecorder = createRecordingFetch(createAnthropicResponse());
    const client = new Llm({
      baseUrl: "https://api.anthropic.com/v1",
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({
        maxTokens: 1024,
        model: "claude-example",
      }),
    });

    await client.generate({
      messages: [
        { role: "system", content: [{ type: "text", text: "Act carefully." }] },
        { role: "user", content: [{ type: "text", text: "Hi" }] },
        { role: "assistant", content: [{ type: "text", text: "Hello" }] },
        { role: "system", content: [{ type: "text", text: "Use short answers." }] },
        { role: "user", content: [{ type: "text", text: "Next" }] },
      ],
      options: {
        maxTokens: 256,
        temperature: 0.3,
        topP: 0.9,
      },
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://api.anthropic.com/v1/messages");
    expect(readRequestBody(fetchRecorder.calls[0])).toEqual({
      max_tokens: 256,
      messages: [
        { role: "user", content: [{ type: "text", text: "Hi" }] },
        { role: "assistant", content: [{ type: "text", text: "Hello" }] },
        {
          role: "user",
          content: [{ type: "text", text: "System: Use short answers.\n\nNext" }],
        },
      ],
      model: "claude-example",
      system: "Act carefully.",
      temperature: 0.3,
      top_p: 0.9,
    });
  });

  it("adds a starter user message when Anthropic would otherwise receive no user turn", async () => {
    const fetchRecorder = createRecordingFetch(createAnthropicResponse());
    const client = new Llm({
      baseUrl: "https://api.anthropic.com/v1",
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({
        maxTokens: 1024,
        model: "claude-example",
      }),
    });

    await client.generate({
      messages: [{ role: "system", content: [{ type: "text", text: "Only system." }] }],
    });

    expect(readRequestBody(fetchRecorder.calls[0]).messages).toEqual([
      { role: "user", content: [{ type: "text", text: "Start" }] },
    ]);
    expect(readRequestBody(fetchRecorder.calls[0]).system).toBe("Only system.");
  });

  it("parses text, thinking, redacted thinking, usage, and finish reason", async () => {
    const fetchRecorder = createRecordingFetch({
      content: [
        { type: "thinking", thinking: "Plan first." },
        { type: "redacted_thinking" },
        { type: "text", text: "Done." },
      ],
      stop_reason: "max_tokens",
      usage: {
        input_tokens: 11,
        output_tokens: 7,
      },
    });
    const client = new Llm({
      baseUrl: "https://api.anthropic.com/v1",
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({
        maxTokens: 1024,
        model: "claude-example",
      }),
    });

    const output = await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
    });

    expect(output.message.text).toBe("Done.");
    expect(output.reasoning?.text).toBe("Plan first.\n{{redacted_thinking}}");
    expect(output.usage).toEqual({
      inputTokens: 11,
      outputTokens: 7,
      totalTokens: 18,
    });
    expect(output.finishReason).toBe("length");
  });

  it("throws when Anthropic response has no text content", async () => {
    const fetchRecorder = createRecordingFetch({
      content: [{ type: "thinking", thinking: "No visible answer." }],
    });
    const client = new Llm({
      baseUrl: "https://api.anthropic.com/v1",
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({
        maxTokens: 1024,
        model: "claude-example",
      }),
    });

    await expect(
      client.generate({
        messages: [{ role: "user", content: [{ type: "text", text: "Hi" }] }],
      }),
    ).rejects.toThrow(LlmIoError);
  });
});
