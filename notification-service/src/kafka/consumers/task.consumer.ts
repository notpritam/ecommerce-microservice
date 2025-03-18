import { Kafka, Consumer } from "kafkajs";
import logger from "../../config/logger";
import ENV from "../../config/env";
import notificationService from "../../services/notification.service";

const kafka = new Kafka({
  clientId: ENV.kafka_client_id,
  brokers: [ENV.kafka_brokers],
});

const consumer = kafka.consumer({
  groupId: "notification-service-tasks-group",
});

const demo = async (data: any) => {
  console.log("Demo task handler", data);
};

// Here i am mapping the task name to the function that will handle the task

const taskHandlers: Record<string, (data: any) => Promise<void>> = {
  "send-promotional-notifications": demo,
  "process-order-status-updates": notificationService.handleOrderStatusChange,
  "send-recommendation-notification": demo,
  "send-notification": notificationService.sendNotification,
};

export const initTaskConsumer = async (): Promise<void> => {
  try {
    await consumer.connect();
    logger.info("Connected to Kafka consumer");
    await consumer.subscribe({
      topic: "notification.tasks",
      fromBeginning: false,
    });
    await consumer.subscribe({
      topic: "order.events",
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const messageValue = message.value?.toString();
          if (!messageValue) return;

          const taskData = JSON.parse(messageValue);

          console.log("Task data", taskData);

          logger.info(`Received scheduled task: ${taskData.taskName}`);

          const handler = taskHandlers[taskData.taskName];
          if (handler) {
            await handler(taskData.data);
            logger.info(`Successfully processed task: ${taskData.taskName}`);
          } else {
            logger.warn(`No handler found for task: ${taskData.taskName}`);
          }
        } catch (error) {
          logger.error("Error processing task message:", error);
        }
      },
    });

    logger.info("Task consumer initialized");
  } catch (error) {
    logger.error("Failed to initialize task consumer:", error);
    throw error;
  }
};
