import { z } from "zod";

export const saveOnboardingSchema = z.object({
  currentStep: z.string().optional(),
  responses: z.record(z.string(), z.unknown()),
});

export type SaveOnboardingInput = z.infer<typeof saveOnboardingSchema>;
