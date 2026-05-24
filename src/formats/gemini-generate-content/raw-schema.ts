import { z } from "zod";

export const geminiGenerateContentRawSchema = z
  .object({
    candidates: z
      .array(
        z
          .object({
            content: z
              .object({
                parts: z
                  .array(
                    z
                      .object({
                        functionCall: z
                          .object({
                            args: z.record(z.unknown()).optional(),
                            name: z.string(),
                          })
                          .passthrough()
                          .optional(),
                        text: z.string().optional(),
                        thought: z.boolean().optional(),
                      })
                      .passthrough(),
                  )
                  .optional(),
              })
              .passthrough()
              .optional(),
            finishReason: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
    usageMetadata: z
      .object({
        candidatesTokenCount: z.number().optional(),
        promptTokenCount: z.number().optional(),
        thoughtsTokenCount: z.number().optional(),
        totalTokenCount: z.number().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type GeminiGenerateContentRaw = z.infer<typeof geminiGenerateContentRawSchema>;
