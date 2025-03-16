import Scheduler from "../models/scheduler.model";

// to create default tasks if none exist
export const createDefaultTasks = async () => {
  console.log("Creating default scheduler tasks");

  const defaultTasks = [
    {
      taskName: "daily-recommendations",
      serviceType: "recommendation",
      cronExpression: "0 8 * * *", // Every day at 8 AM
      enabled: true,
      data: {
        maxRecommendations: 5,
        includePriceDrops: true,
      },
    },
    {
      taskName: "weekly-newsletter",
      serviceType: "notification",
      cronExpression: "0 10 * * 1", // Every Monday at 10 AM
      enabled: true,
      data: {
        templateId: "weekly-newsletter",
        includeTopProducts: true,
      },
    },
    {
      taskName: "cart-abandonment",
      serviceType: "notification",
      cronExpression: "0 */4 * * *", // Every 4 hours
      enabled: true,
      data: {
        timeThreshold: 4, // Hours since cart abandonment
        includeDiscount: true,
        discountAmount: 5, // Percentage
      },
    },
    {
      taskName: "order-status-updates",
      serviceType: "order",
      cronExpression: "*/15 * * * *", // Every 15 minutes
      enabled: true,
      data: {},
    },
  ];

  for (const taskData of defaultTasks) {
    const task = new Scheduler(taskData);
    await task.save();
  }

  console.log("Default tasks created successfully");
};
