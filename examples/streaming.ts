import { Llm, OpenAIChatCompletionsFormat, OpenAIProvider } from "../src/index";

const llm = new Llm({
  format: new OpenAIChatCompletionsFormat({ model: "gpt-5.1" }),
  provider: new OpenAIProvider({ apiKey: "YOUR_OPENAI_API_KEY" }),
});

const request = {
  messages: [
    {
      role: "user",
      content: [{ type: "text", text: "Write a short greeting." }],
    },
  ],
} as const;

let streamedText = "";

for await (const event of llm.stream(request)) {
  if (event.type === "text-delta") {
    streamedText += event.text;
  }

  if (event.type === "done") {
    console.log(streamedText);
    console.log("finish:", event.finishReason);
  }
}

let textOnly = "";

for await (const text of llm.streamText(request)) {
  textOnly += text;
}

console.log(textOnly);
