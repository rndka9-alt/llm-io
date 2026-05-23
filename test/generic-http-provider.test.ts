import { describe, expect, it } from "vitest";
import { GenericHttpProvider, Llm, OpenAIChatCompletionsFormat } from "../src/index";
import { createRecordingFetch } from "./test-utils";

describe("GenericHttpProvider", () => {
  it("uses custom request path resolver", async () => {
    const fetchRecorder = createRecordingFetch({
      choices: [{ message: { content: "ok" } }],
    });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new OpenAIChatCompletionsFormat({ model: "gpt-example" }),
      provider: new GenericHttpProvider({
        baseUrl: "https://generic.test/root/",
        resolveRequestPath: (format) => `custom/${format.id}`,
      }),
    });

    await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(fetchRecorder.calls[0]?.input).toBe(
      "https://generic.test/root/custom/openai-chat-completions",
    );
  });
});
