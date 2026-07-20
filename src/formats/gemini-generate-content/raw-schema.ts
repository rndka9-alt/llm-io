import { z } from "zod/v4";

import { jsonObjectSchema, jsonValueSchema } from "../../utils/json";

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
                            id: z.string().optional(),
                            name: z.string(),
                          })
                          .loose()
                          .optional(),
                        text: z.string().optional(),
                        thought: z.boolean().optional(),
                      })
                      .loose(),
                  )
                  .optional(),
              })
              .loose()
              .optional(),
            finishReason: z.string().optional(),
          })
          .loose(),
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
      .loose()
      .optional(),
  })
  .loose();

export type GeminiGenerateContentRaw = z.infer<typeof geminiGenerateContentRawSchema>;
