import mongoose, { Document, Schema } from "mongoose";

export enum ActivityType {
  VIEW_PRODUCT = "view_product",
  ADD_TO_CART = "add_to_cart",
  ADD_TO_WISHLIST = "add_to_wishlist",
  PURCHASE = "purchase",
  SEARCH = "search",
}

export const activityWeights: Record<ActivityType, number> = {
  [ActivityType.VIEW_PRODUCT]: 1,
  [ActivityType.ADD_TO_CART]: 5,
  [ActivityType.ADD_TO_WISHLIST]: 3,
  [ActivityType.PURCHASE]: 10,
  [ActivityType.SEARCH]: 0.5,
};

export interface IUserActivity extends Document {
  userId: string;
  productId?: string;
  categories?: string[];
  searchQuery?: string;
  activityType: ActivityType;
  weight: number;
  timestamp: Date;
  expireAt: Date;
  metadata?: Record<string, any>;
}

const UserActivitySchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  productId: {
    type: String,
    index: true,
  },
  categories: {
    type: [String],
  },
  searchQuery: {
    type: String,
  },
  activityType: {
    type: String,
    enum: Object.values(ActivityType),
    required: true,
  },
  weight: {
    type: Number,
    default: 1,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    index: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
});

UserActivitySchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

UserActivitySchema.index({ userId: 1, activityType: 1, timestamp: -1 });
UserActivitySchema.index({ userId: 1, productId: 1, timestamp: -1 });

export const UserActivity = mongoose.model<IUserActivity>(
  "UserActivity",
  UserActivitySchema
);
