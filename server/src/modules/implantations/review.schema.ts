import { z } from "zod";

export const updateReviewResponsesSchema = z.object({
  responses: z.record(z.string(), z.unknown()),
});

export type UpdateReviewResponsesInput = z.infer<typeof updateReviewResponsesSchema>;
