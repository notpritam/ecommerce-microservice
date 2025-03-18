export type ServiceType = "user" | "notification" | "recommendation" | "order";

export interface IScheduler {
  id: string;
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
