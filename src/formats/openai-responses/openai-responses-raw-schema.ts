import { z } from "zod";

export const openAIResponsesRawSchema = z
  .object({
    id: z.string().optional(),
    output: z.array(z.unknown()).optional(),
    usage: z
      .object({
        input_tokens: z.number().optional(),
        output_tokens: z.number().optional(),
        output_tokens_details: z
          .object({
            reasoning_tokens: z.number().optional(),
          })
          .passthrough()
          .optional(),
        total_tokens: z.number().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type OpenAIResponsesRaw = z.infer<typeof openAIResponsesRawSchema>;
