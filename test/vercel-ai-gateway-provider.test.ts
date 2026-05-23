import { describe, expect, it } from "vitest";
import {
  Llm,
  OpenAIChatCompletionsFormat,
  OpenAIResponsesFormat,
  VercelAIGatewayProvider,
} from "../src/index";
import { createRecordingFetch, readRequestBody } from "./test-utils";

describe("VercelAIGatewayProvider", () => {
  it("injects providerOptions into OpenAI-compatible bodies", async () => {
    const fetchRecorder = createRecordingFetch({
      choices: [{ message: { content: "ok" } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "openai/gpt-5.1" }),
      provider: new VercelAIGatewayProvider({
        apiKey: "gateway-key",
        providerOptions: {
          gateway: {
            only: ["openai"],
          },
        },
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://ai-gateway.vercel.sh/v1/chat/completions");
    expect(readRequestBody(fetchRecorder.calls[0]).providerOptions).toEqual({
      gateway: {
        only: ["openai"],
      },
    });
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
});
