import {
  createToolResultMessage,
  Llm,
  OpenAIChatCompletionsFormat,
  OpenAIProvider,
  type JsonObject,
  type LlmMessage,
  type LlmToolCall,
} from "../src/index";

const llm = new Llm({
  format: new OpenAIChatCompletionsFormat({
    model: "gpt-5.1",
    extraBody: {
      tools: [
        {
          type: "function",
          function: {
            name: "lookup_weather",
            description: "Look up the current weather for a city.",
            parameters: {
              type: "object",
              properties: {
                location: { type: "string" },
              },
              required: ["location"],
              additionalProperties: false,
            },
          },
        },
      ],
    },
  }),
  provider: new OpenAIProvider({ apiKey: "YOUR_OPENAI_API_KEY" }),
});

const messages: LlmMessage[] = [
  {
    role: "user",
    content: [{ type: "text", text: "What is the weather in Seoul?" }],
  },
];

const firstOutput = await llm.generate({ messages });

if (firstOutput.toolCalls === undefined) {
  console.log(firstOutput.message.text);
} else {
  const toolResults = firstOutput.toolCalls.map((toolCall) =>
    createToolResultMessage(toolCall, executeToolCall(toolCall)),
  );

  const finalOutput = await llm.generate({
    messages: [...messages, firstOutput.message, ...toolResults],
  });

  console.log(finalOutput.message.text);
}

function executeToolCall(toolCall: LlmToolCall): JsonObject {
  if (toolCall.name !== "lookup_weather") {
    throw new Error(`Unsupported tool call: ${toolCall.name}`);
  }

  const location = toolCall.arguments.location;

  if (typeof location !== "string") {
    throw new Error("lookup_weather requires a string location.");
  }

  return {
    location,
    condition: "clear",
    temperatureCelsius: 22,
  };
}
