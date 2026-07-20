import { z } from "zod/v4";

import { jsonObjectSchema } from "../../utils/json";

const anthropicMessagesKnownContentBlockTypes = [
  "text",
  "tool_use",
  "thinking",
  "redacted_thinking",
] as const;

export const anthropicMessagesTextBlockSchema = z.object({
  text: z.string(),
  type: z.literal("text"),
});

export const anthropicMessagesToolUseBlockSchema = z.object({
  id: z.string(),
  input: jsonObjectSchema,
  name: z.string(),
  type: z.literal("tool_use"),
});

export const anthropicMessagesThinkingBlockSchema = z.object({
  signature: z.string().optional(),
  thinking: z.string(),
  type: z.literal("thinking"),
});

export const anthropicMessagesRedactedThinkingBlockSchema = z.object({
  data: z.string().optional(),
  type: z.literal("redacted_thinking"),
});

export const anthropicMessagesKnownContentBlockSchema = z.discriminatedUnion("type", [
  anthropicMessagesTextBlockSchema,
  anthropicMessagesToolUseBlockSchema,
  anthropicMessagesThinkingBlockSchema,
  anthropicMessagesRedactedThinkingBlockSchema,
]);

export const anthropicMessagesUnknownContentBlockSchema = z.object({
  type: z
    .string()
    .refine(
      (type) => !anthropicMessagesKnownContentBlockTypes.some((knownType) => knownType === type),
      "Known Anthropic content block types must match their documented schema.",
    ),
});

export const anthropicMessagesContentBlockSchema = z.union([
  anthropicMessagesKnownContentBlockSchema,
  anthropicMessagesUnknownContentBlockSchema,
]);

export const anthropicMessagesUsageSchema = z
  .object({
    cache_creation_input_tokens: z.number().optional(),
    cache_read_input_tokens: z.number().optional(),
    input_tokens: z.number().optional(),
    output_tokens: z.number().optional(),
    server_tool_use: jsonObjectSchema.optional(),
  })
  .loose();

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
  .loose();

export type AnthropicMessagesRaw = z.infer<typeof anthropicMessagesRawSchema>;
export type AnthropicMessagesContentBlock = z.infer<typeof anthropicMessagesContentBlockSchema>;
