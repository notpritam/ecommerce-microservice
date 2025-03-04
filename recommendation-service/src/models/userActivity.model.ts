import mongoose, { Document, Schema } from "mongoose";

export type ActivityType = "view" | "add_to_cart" | "purchase" | "search";

export interface IUserActivity extends Document {
  userId: string;
  productId: string;
  activityType: ActivityType;
  timestamp: Date;
  metadata?: any;
}

const UserActivitySchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    activityType: {
      type: String,
      enum: ["view", "add_to_cart", "purchase", "search"],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

UserActivitySchema.index({ userId: 1, timestamp: -1 });

const UserActivity = mongoose.model<IUserActivity>(
  "UserActivity",
  UserActivitySchema
);

export default UserActivity;
