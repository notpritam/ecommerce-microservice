import { Kafka, Producer } from "kafkajs";
import ENV from "../../config/env";
import logger from "../../config/logger";

const kafka = new Kafka({
  clientId: ENV.kafka_client_id,
  brokers: [ENV.kafka_brokers],
});

const producer = kafka.producer();

export const connectProducer = async () => {
  try {
    await producer.connect();
    logger.info("Kafka producer connected");
  } catch (error) {
    logger.error("Error connecting to Kafka producer:", error);
    throw error;
  }
};

export const disconnectProducer = async () => {
  try {
    await producer.disconnect();
    logger.info("Kafka producer disconnected");
  } catch (error) {
    logger.error("Error disconnecting from Kafka producer:", error);
    throw error;
  }
};

export const dispatchTask = async (
  serviceType: string,
  taskName: string,
  data: any
): Promise<void> => {
  try {
    const topic = `${serviceType}-tasks`;

    await producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify({
            taskName,
            data,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
  } catch (error) {
    logger.error("Error dispatching task:", error);
    throw error;
  }
};
