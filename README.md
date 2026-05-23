# llm-io

Typed LLM input/output adapters.

The package keeps application call sites stable while provider wire formats vary:

- call sites send the same `LlmRequest`
- each provider decides request URLs and auth for a format
- each `LlmFormat` builds provider wire request bodies
- each `LlmFormat` parses and validates raw provider responses internally
- outputs expose common `message`, `reasoning`, `usage`, and typed `raw`

```ts
import { Llm, OpenAIProvider, OpenAIResponsesFormat } from "llm-io";

const client = new Llm({
  format: new OpenAIResponsesFormat({ model: "gpt-5.1" }),
  provider: new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }),
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

Providers and formats are intentionally separate. Google AI Studio and Vertex AI can share the same Gemini wire format while using different auth and URL construction:

```ts
import { GeminiGenerateContentFormat, Llm, VertexAIProvider } from "llm-io";

const vertex = new Llm({
  format: new GeminiGenerateContentFormat({ model: "gemini-2.5-flash" }),
  provider: new VertexAIProvider({
    accessToken,
    location: "us-central1",
    projectId: "my-project",
  }),
});
```
