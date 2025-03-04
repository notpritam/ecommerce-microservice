// src/models/recommendation.model.ts

import mongoose, { Document, Schema } from "mongoose";

interface IRecommendedProduct {
  productId: string;
  score: number;
  reason?: string;
}

export interface IRecommendation extends Document {
  userId: string;
  products: IRecommendedProduct[];
  generatedAt: Date;
  expiresAt: Date;
  isNotified: boolean;
}

const RecommendationSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    products: [
      {
        productId: {
          type: String,
          required: true,
        },
        score: {
          type: Number,
          required: true,
        },
        reason: {
          type: String,
        },
      },
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isNotified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

RecommendationSchema.index({ userId: 1, isNotified: 1 });

const Recommendation = mongoose.model<IRecommendation>(
  "Recommendation",
  RecommendationSchema
);

export default Recommendation;
