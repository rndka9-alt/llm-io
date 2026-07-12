import { z } from "zod";

const openAIResponsesKnownOutputItemTypes = ["function_call", "message", "reasoning"] as const;
const openAIResponsesKnownMessageContentPartTypes = ["output_text"] as const;
const openAIResponsesKnownReasoningContentPartTypes = ["reasoning_text", "summary_text"] as const;

export const openAIResponsesFunctionCallOutputItemSchema = z
  .object({
    arguments: z.string(),
    call_id: z.string(),
    name: z.string(),
    type: z.literal("function_call"),
  })
  .passthrough();

export const openAIResponsesOutputTextContentPartSchema = z
  .object({
    text: z.string(),
    type: z.literal("output_text"),
  })
  .passthrough();

export const openAIResponsesUnknownMessageContentPartSchema = z
  .object({
    type: z
      .string()
      .refine(
        (type) =>
          !openAIResponsesKnownMessageContentPartTypes.some((knownType) => knownType === type),
        "Known OpenAI Responses message content part types must match their documented schema.",
      ),
  })
  .passthrough();

export const openAIResponsesMessageContentPartSchema = z.union([
  openAIResponsesOutputTextContentPartSchema,
  openAIResponsesUnknownMessageContentPartSchema,
]);

export const openAIResponsesMessageOutputItemSchema = z
  .object({
    content: z.array(openAIResponsesMessageContentPartSchema),
    type: z.literal("message"),
  })
  .passthrough();

export const openAIResponsesReasoningSummaryPartSchema = z
  .object({
    text: z.string(),
    type: z.literal("summary_text"),
  })
  .passthrough();

export const openAIResponsesReasoningTextPartSchema = z
  .object({
    text: z.string(),
    type: z.literal("reasoning_text"),
  })
  .passthrough();

export const openAIResponsesUnknownReasoningContentPartSchema = z
  .object({
    type: z
      .string()
      .refine(
        (type) =>
          !openAIResponsesKnownReasoningContentPartTypes.some((knownType) => knownType === type),
        "Known OpenAI Responses reasoning content part types must match their documented schema.",
      ),
  })
  .passthrough();

export const openAIResponsesReasoningContentPartSchema = z.union([
  openAIResponsesReasoningTextPartSchema,
  openAIResponsesUnknownReasoningContentPartSchema,
]);

export const openAIResponsesReasoningOutputItemSchema = z
  .object({
    content: z.array(openAIResponsesReasoningContentPartSchema).optional(),
    summary: z.array(openAIResponsesReasoningSummaryPartSchema).optional(),
    type: z.literal("reasoning"),
  })
  .passthrough();

export const openAIResponsesUnknownOutputItemSchema = z
  .object({
    type: z
      .string()
      .refine(
        (type) => !openAIResponsesKnownOutputItemTypes.some((knownType) => knownType === type),
        "Known OpenAI Responses output item types must match their documented schema.",
      ),
  })
  .passthrough();

export const openAIResponsesOutputItemSchema = z.union([
  openAIResponsesFunctionCallOutputItemSchema,
  openAIResponsesMessageOutputItemSchema,
  openAIResponsesReasoningOutputItemSchema,
  openAIResponsesUnknownOutputItemSchema,
]);

export const openAIResponsesRawSchema = z
  .object({
    id: z.string().optional(),
    output: z.array(openAIResponsesOutputItemSchema).optional(),
    usage: z
      .object({
        input_tokens: z.number().optional(),
        input_tokens_details: z
          .object({
            cache_write_tokens: z.number().optional(),
            cached_tokens: z.number().optional(),
          })
          .passthrough()
          .optional(),
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
