import { Llm, OpenAIChatCompletionsFormat, OpenAIProvider, type LlmMessage } from "../src/index";

const llm = new Llm({
  format: new OpenAIChatCompletionsFormat({ model: "gpt-5.1" }),
  provider: new OpenAIProvider({ apiKey: "YOUR_OPENAI_API_KEY" }),
});

const messages: LlmMessage[] = [
  {
    role: "user",
    content: [{ type: "text", text: "My name is Mina." }],
  },
];

const firstOutput = await llm.generate({ messages });

messages.push(firstOutput.message);
messages.push({
  role: "user",
  content: [{ type: "text", text: "What is my name?" }],
});

const secondOutput = await llm.generate({ messages });

console.log(secondOutput.message.text);
