export function createAnthropicResponse(): unknown {
  return {
    content: [{ type: "text", text: "ok" }],
    stop_reason: "end_turn",
    usage: {
      input_tokens: 1,
      output_tokens: 1,
    },
  };
}
