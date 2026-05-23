import { z } from "zod";

export const anthropicMessagesContentBlockSchema = z
  .object({
    type: z.string(),
  })
  .passthrough();

export const anthropicMessagesUsageSchema = z
  .object({
    input_tokens: z.number().optional(),
    output_tokens: z.number().optional(),
  })
  .passthrough();

export const anthropicMessagesRawSchema = z
  .object({
    content: z.array(anthropicMessagesContentBlockSchema),
    id: z.string().optional(),
    model: z.string().optional(),
    role: z.literal("assistant").optional(),
    stop_reason: z.string().nullable().optional(),
    stop_sequence: z.string().nullable().optional(),
    type: z.literal("message").optional(),
    usage: anthropicMessagesUsageSchema.optional(),
  })
  .passthrough();

export type AnthropicMessagesRaw = z.infer<typeof anthropicMessagesRawSchema>;
