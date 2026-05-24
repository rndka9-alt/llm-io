import { Llm, OpenAIChatCompletionsFormat, OpenAIProvider } from "../src/index";

const llm = new Llm({
  format: new OpenAIChatCompletionsFormat({ model: "gpt-5.1" }),
  provider: new OpenAIProvider({ apiKey: "YOUR_OPENAI_API_KEY" }),
});

const output = await llm.generate({
  messages: [
    {
      role: "user",
      content: [{ type: "text", text: "Explain llm-io in one sentence." }],
    },
  ],
});

console.log(output.message.text);
