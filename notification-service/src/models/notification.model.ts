import mongoose, { Document, Schema, Types } from "mongoose";

export type NotificationType = "promotion" | "order_update" | "recommendation";

export interface INotification extends Document {
  userId: string;
  type: NotificationType;
  content: any;
  recommendationId?: string;
  read: boolean;
  sentAt: Date;
  expiresAt?: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["promotion", "order_update", "recommendation"],
      required: true,
    },
    recommendationId: {
      type: String,
      default: null,
    },
    content: {
      type: Schema.Types.Mixed,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, type: 1 });

NotificationSchema.virtual("id").get(function (this: INotification) {
  return (this._id as Types.ObjectId).toHexString();
});

NotificationSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);

export default Notification;
