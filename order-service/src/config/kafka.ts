import { Kafka } from "kafkajs";
import logger from "./logger";
import ENV from "./env";

const kafka = new Kafka({
  clientId: "order-service",
  brokers: [ENV.kafka_brokers],
});

export const producer = kafka.producer();

export const connectProducer = async () => {
  try {
    await producer.connect();
    logger.info("Connected to Kafka producer");
  } catch (error) {
    logger.error("Failed to connect to Kafka producer", error);
    // Retry connection after a delay
    setTimeout(connectProducer, 5000);
  }
};
