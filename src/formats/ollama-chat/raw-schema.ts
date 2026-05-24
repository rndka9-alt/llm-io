import { z } from "zod";

import { jsonObjectSchema } from "../../utils/json";

export const ollamaChatRawSchema = z
  .object({
    done: z.boolean().optional(),
    done_reason: z.string().optional(),
    eval_count: z.number().optional(),
    message: z
      .object({
        content: z.string().optional(),
        thinking: z.string().optional(),
        tool_calls: z
          .array(
            z
              .object({
                function: z
                  .object({
                    arguments: jsonObjectSchema,
                    name: z.string(),
                  })
                  .passthrough(),
              })
              .passthrough(),
          )
          .optional(),
      })
      .passthrough()
      .optional(),
    model: z.string().optional(),
    prompt_eval_count: z.number().optional(),
  })
  .passthrough();

export type OllamaChatRaw = z.infer<typeof ollamaChatRawSchema>;
