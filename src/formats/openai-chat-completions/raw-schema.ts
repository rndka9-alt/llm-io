import { z } from "zod";

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
                          .passthrough(),
                        id: z.string().optional(),
                        type: z.literal("function"),
                      })
                      .passthrough(),
                  )
                  .optional(),
              })
              .passthrough(),
          })
          .passthrough(),
      )
      .min(1),
    usage: z
      .object({
        completion_tokens_details: z
          .object({
            reasoning_tokens: z.number().optional(),
          })
          .passthrough()
          .optional(),
        completion_tokens: z.number().optional(),
        prompt_tokens_details: z
          .object({
            cached_tokens: z.number().optional(),
          })
          .passthrough()
          .optional(),
        prompt_tokens: z.number().optional(),
        total_tokens: z.number().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

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
                          .passthrough()
                          .optional(),
                        id: z.string().optional(),
                        index: z.number(),
                        type: z.literal("function").optional(),
                      })
                      .passthrough(),
                  )
                  .optional(),
              })
              .passthrough(),
            finish_reason: z.string().nullable().optional(),
            index: z.number(),
          })
          .passthrough(),
      )
      .optional(),
    usage: openAIChatCompletionsRawSchema.shape.usage,
  })
  .passthrough();

export type OpenAIChatCompletionsStreamRaw = z.infer<typeof openAIChatCompletionsStreamRawSchema>;
