# llm-io

Typed LLM input/output adapters.

The package keeps application call sites stable while provider wire formats vary:

- call sites send the same `LlmRequest`
- each `LlmFormat` builds provider-specific request bodies
- each `LlmFormat` parses and validates raw provider responses internally
- outputs expose common `message`, `reasoning`, `usage`, and typed `raw`

```ts
import { Llm, OpenAIResponsesFormat } from "llm-io";

const client = new Llm({
  apiKey: process.env.OPENAI_API_KEY,
  baseUrl: "https://api.openai.com/v1",
  format: new OpenAIResponsesFormat({ model: "gpt-5.1" }),
});

const output = await client.generate({
  messages: [
    {
      role: "user",
      content: [{ type: "text", text: "Say hello." }],
    },
  ],
});

output.message.text;
output.reasoning?.text;
output.usage?.totalTokens;
output.raw.output;
```
