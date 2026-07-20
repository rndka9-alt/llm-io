import { z } from "zod/v4";

import { jsonObjectSchema } from "../../utils/json";

export const openAIChatCompletionsRawSchema = z
  .object({
    choices: z
      .array(
        z
          .object({
            finish_reason: z.string().nullable().optional(),
            message: z
              .object({
                content: z.string().nullable().optional(),
                reasoning: z.string().optional(),
                reasoning_content: z.string().optional(),
                tool_calls: z
                  .array(
                    z
                      .object({
                        function: z
                          .object({
                            arguments: z.string(),
                            name: z.string(),
                          })
                          .loose(),
                        id: z.string().optional(),
                        type: z.literal("function"),
                      })
                      .loose(),
                  )
                  .optional(),
              })
              .loose(),
          })
          .loose(),
      )
      .min(1),
    usage: z
      .object({
        completion_tokens_details: z
          .object({
            reasoning_tokens: z.number().optional(),
          })
          .loose()
          .optional(),
        completion_tokens: z.number().optional(),
        cost: z.number().optional(),
        cost_details: jsonObjectSchema.optional(),
        info: z.string().optional(),
        prompt_tokens_details: z
          .object({
            cache_write_tokens: z.number().optional(),
            cached_tokens: z.number().optional(),
          })
          .loose()
          .optional(),
        prompt_tokens: z.number().optional(),
        total_tokens: z.number().optional(),
      })
      .loose()
      .optional(),
  })
  .loose();

export type OpenAIChatCompletionsRaw = z.infer<typeof openAIChatCompletionsRawSchema>;

export const openAIChatCompletionsStreamRawSchema = z
  .object({
    choices: z
      .array(
        z
          .object({
            delta: z
              .object({
                content: z.string().nullable().optional(),
                reasoning: z.string().optional(),
                reasoning_content: z.string().optional(),
                tool_calls: z
                  .array(
                    z
                      .object({
                        function: z
                          .object({
                            arguments: z.string().optional(),
                            name: z.string().optional(),
                          })
                          .loose()
                          .optional(),
                        id: z.string().optional(),
                        index: z.number(),
                        type: z.literal("function").optional(),
                      })
                      .loose(),
                  )
                  .optional(),
              })
              .loose(),
            finish_reason: z.string().nullable().optional(),
            index: z.number(),
          })
          .loose(),
      )
      .optional(),
    usage: openAIChatCompletionsRawSchema.shape.usage.nullable(),
  })
  .loose();

export type OpenAIChatCompletionsStreamRaw = z.infer<typeof openAIChatCompletionsStreamRawSchema>;
