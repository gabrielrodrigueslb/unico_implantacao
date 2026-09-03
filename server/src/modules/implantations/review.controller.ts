import type { Request, Response } from "express";
import { reviewService } from "./review.service";
import {
  updateReviewResponsesSchema,
} from "./review.schema";

async function getReview(req: Request, res: Response) {
  const review = await reviewService.getReview(req.params.id, req.user!);
  return res.json(review);
}

async function updateResponses(req: Request, res: Response) {
  const data = updateReviewResponsesSchema.parse(req.body);
  const onboarding = await reviewService.updateReviewResponses(
    req.params.id,
    data.responses, req.user!,
  );
  return res.json(onboarding);
}

async function approve(req: Request, res: Response) {
  const snapshot = await reviewService.approve(req.params.id, req.user!.id, req.user!);
  return res.status(201).json(snapshot);
}

export const reviewController = { getReview, updateResponses, approve };
