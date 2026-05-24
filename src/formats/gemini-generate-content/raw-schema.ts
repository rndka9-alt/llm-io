import { z } from "zod";

import { jsonObjectSchema, jsonValueSchema } from "../../core/json";

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
                            args: jsonObjectSchema.optional(),
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
        cachedContentTokenCount: z.number().optional(),
        candidatesTokenCount: z.number().optional(),
        promptTokenCount: z.number().optional(),
        promptTokensDetails: z.array(jsonValueSchema).optional(),
        candidatesTokensDetails: z.array(jsonValueSchema).optional(),
        cacheTokensDetails: z.array(jsonValueSchema).optional(),
        toolUsePromptTokenCount: z.number().optional(),
        thoughtsTokenCount: z.number().optional(),
        trafficType: z.string().optional(),
        totalTokenCount: z.number().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type GeminiGenerateContentRaw = z.infer<typeof geminiGenerateContentRawSchema>;
