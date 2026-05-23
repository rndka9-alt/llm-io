export function createGeminiResponse(): unknown {
  return {
    candidates: [
      {
        content: {
          parts: [{ text: "ok" }],
        },
      },
    ],
  };
}
