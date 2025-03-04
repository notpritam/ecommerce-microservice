import mongoose, { Document, Schema } from "mongoose";

export type ServiceType = "user" | "notification" | "recommendation" | "order";

export interface IScheduler extends Document {
  taskName: string;
  serviceType: ServiceType;
  cronExpression: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

const SchedulerSchema: Schema = new Schema(
  {
    taskName: {
      type: String,
      required: true,
      unique: true,
    },
    serviceType: {
      type: String,
      enum: ["user", "notification", "recommendation", "order"],
      required: true,
    },
    cronExpression: {
      type: String,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    lastRun: {
      type: Date,
    },
    nextRun: {
      type: Date,
    },
    data: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

const Scheduler = mongoose.model<IScheduler>("Scheduler", SchedulerSchema);

export default Scheduler;
