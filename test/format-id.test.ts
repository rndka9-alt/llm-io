import { describe, expect, it } from "vitest";
import {
  CustomProvider,
  LLM_FORMAT_IDS,
  Llm,
  type LlmFormat,
  type LlmOutput,
  type LlmRequest,
  llmFormatIdSchema,
} from "../src/index";
import { createRecordingFetch } from "./test-utils";

interface CustomRaw {
  text: string;
}

class CustomFormat implements LlmFormat<CustomRaw, undefined, "custom-format"> {
  readonly id = "custom-format";

  createRequestBody(request: LlmRequest) {
    return {
      messages: request.messages,
    };
  }

  parseResponse(responseJson: unknown): LlmOutput<CustomRaw> {
    if (!isCustomRaw(responseJson)) {
      throw new Error("Invalid custom response.");
    }

    return {
      raw: responseJson,
      message: {
        role: "assistant",
        content: [{ type: "text", text: responseJson.text }],
        text: responseJson.text,
      },
    };
  }
}

describe("format ids", () => {
  it("validates built-in format ids with zod", () => {
    expect(llmFormatIdSchema.parse(LLM_FORMAT_IDS.openaiChatCompletions)).toBe(
      LLM_FORMAT_IDS.openaiChatCompletions,
    );
    expect(() => llmFormatIdSchema.parse("custom-format")).toThrow();
  });

  it("allows custom format ids when they are explicitly typed", async () => {
    const fetchRecorder = createRecordingFetch({ text: "ok" });
    const client = new Llm({
      fetch: fetchRecorder.fetch,
      format: new CustomFormat(),
      provider: new CustomProvider({
        baseUrl: "https://custom.example",
        requestPath: "/custom-format",
      }),
    });

    const output = await client.generate({
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
    });

    expect(output.message.text).toBe("ok");
    expect(fetchRecorder.calls[0]?.input).toBe("https://custom.example/custom-format");
  });
});

function isCustomRaw(value: unknown): value is CustomRaw {
  return (
    typeof value === "object" && value !== null && "text" in value && typeof value.text === "string"
  );
}
