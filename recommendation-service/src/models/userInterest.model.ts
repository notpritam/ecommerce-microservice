import mongoose, { Document, Schema } from "mongoose";

export interface IUserInterest extends Document {
  userId: string;
  interestType: "product" | "category";
  itemId: string;
  score: number;
  lastUpdated: Date;
}

const UserInterestSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  interestType: {
    type: String,
    enum: ["product", "category"],
    required: true,
  },
  itemId: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

UserInterestSchema.index({ userId: 1, interestType: 1 });
UserInterestSchema.index({ userId: 1, score: -1 });

export const UserInterest = mongoose.model<IUserInterest>(
  "UserInterest",
  UserInterestSchema
);
