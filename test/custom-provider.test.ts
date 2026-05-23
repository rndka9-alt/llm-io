import { describe, expect, it } from "vitest";
import { CustomProvider, Llm, LlmIoError, OpenAIChatCompletionsFormat } from "../src/index";
import { createRecordingFetch, readRequestBody } from "./test-utils";

describe("CustomProvider", () => {
  it("allows fixed request path and custom headers", async () => {
    const fetchRecorder = createRecordingFetch({
      choices: [{ message: { content: "ok" } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "custom-model" }),
      provider: new CustomProvider({
        apiKey: "custom-key",
        baseUrl: "https://custom.example/root",
        headers: {
          "x-team": "llm-io",
        },
        requestPath: "/v2/generate",
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe("https://custom.example/root/v2/generate");
    expect(fetchRecorder.calls[0]?.init?.headers).toEqual({
      "content-type": "application/json",
      "x-team": "llm-io",
      authorization: "Bearer custom-key",
    });
  });

  it("allows body and header factories to replace the outgoing request", async () => {
    const fetchRecorder = createRecordingFetch({
      choices: [{ message: { content: "ok" } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "custom-model" }),
      provider: new CustomProvider({
        baseUrl: "https://custom.example",
        createBody: ({ body }) => ({
          payload: body,
          vendor_flag: true,
        }),
        createHeaders: ({ headers }) => ({
          ...headers,
          "x-custom-body": "true",
        }),
        resolveRequestPath: ({ format }) => `/formats/${format.id}`,
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe(
      "https://custom.example/formats/openai-chat-completions",
    );
    expect(readRequestBody(fetchRecorder.calls[0])).toEqual({
      payload: {
        model: "custom-model",
        messages: [{ role: "user", content: "hi" }],
      },
      vendor_flag: true,
    });
    expect(fetchRecorder.calls[0]?.init?.headers?.["x-custom-body"]).toBe("true");
  });

  it("throws when fixed and dynamic request paths are configured together", () => {
    expect(
      () =>
        new CustomProvider({
          baseUrl: "https://custom.example",
          requestPath: "/chat/completions",
          resolveRequestPath: () => "/other",
        }),
    ).toThrow(LlmIoError);
  });
});
