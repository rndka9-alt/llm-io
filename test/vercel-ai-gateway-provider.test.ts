import { describe, expect, it } from "vitest";
import {
  AnthropicMessagesFormat,
  Llm,
  OpenAIChatCompletionsFormat,
  OpenAIResponsesFormat,
  VercelAIGatewayProvider,
  type VercelAIGatewayProviderOptionsMap,
} from "../src/index";
import { createAnthropicResponse, createRecordingFetch, readRequestBody } from "./test-utils";

describe("VercelAIGatewayProvider", () => {
  it("injects providerOptions into OpenAI-compatible bodies", async () => {
    const providerOptions = {
      gateway: {
        byok: {
          openai: [{ apiKey: "openai-key" }],
        },
        caching: "auto",
        models: ["openai/gpt-5.1-mini"],
        only: ["openai"],
        order: ["openai"],
        providerTimeouts: {
          byok: {
            openai: 15_000,
          },
        },
        tags: ["typed-provider-options"],
        user: "user-123",
        zeroDataRetention: true,
      },
      openai: {
        reasoningEffort: "high",
      },
    } satisfies VercelAIGatewayProviderOptionsMap<{
      openai: {
        reasoningEffort: "high";
      };
    }>;
    const fetchRecorder = createRecordingFetch({
      choices: [{ message: { content: "ok" } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "openai/gpt-5.1" }),
      provider: new VercelAIGatewayProvider({
        apiKey: "gateway-key",
        providerOptions,
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://ai-gateway.vercel.sh/v1/chat/completions");
    expect(readRequestBody(fetchRecorder.calls[0]).providerOptions).toEqual({
      gateway: {
        byok: {
          openai: [{ apiKey: "openai-key" }],
        },
        caching: "auto",
        models: ["openai/gpt-5.1-mini"],
        only: ["openai"],
        order: ["openai"],
        providerTimeouts: {
          byok: {
            openai: 15_000,
          },
        },
        tags: ["typed-provider-options"],
        user: "user-123",
        zeroDataRetention: true,
      },
      openai: {
        reasoningEffort: "high",
      },
    });
  });

  it("rejects non-JSON providerOptions at compile time", () => {
    const providerOptions = {
      openai: {
        // @ts-expect-error reasoningEffort follows documented provider option values.
        reasoningEffort: "maximum",
      },
    } satisfies VercelAIGatewayProviderOptionsMap;

    expect(providerOptions.openai).toBeDefined();
  });

  it("allows custom provider option maps when explicitly requested", () => {
    const providerOptions = {
      customProvider: {
        customFlag: true,
      },
      gateway: {
        caching: "auto",
      },
    } satisfies VercelAIGatewayProviderOptionsMap<{
      customProvider: {
        customFlag: boolean;
      };
    }>;

    expect(providerOptions.customProvider.customFlag).toBe(true);
  });

  it("uses responses endpoint", async () => {
    const fetchRecorder = createRecordingFetch({
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: "ok" }],
        },
      ],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIResponsesFormat({ model: "openai/gpt-5.1" }),
      provider: new VercelAIGatewayProvider({ apiKey: "gateway-key" }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://ai-gateway.vercel.sh/v1/responses");
  });

  it("uses Anthropic messages endpoint", async () => {
    const fetchRecorder = createRecordingFetch(createAnthropicResponse());
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new AnthropicMessagesFormat({
        maxTokens: 1024,
        model: "anthropic/claude-opus-4.6",
      }),
      provider: new VercelAIGatewayProvider({ apiKey: "gateway-key" }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://ai-gateway.vercel.sh/v1/messages");
  });
});
