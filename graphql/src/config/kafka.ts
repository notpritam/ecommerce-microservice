import { Kafka } from "kafkajs";
import logger from "./logger";

const kafka = new Kafka({
  clientId: "graphql-gateway",
  brokers: process.env.KAFKA_BROKERS?.split(",") || ["localhost:9092"],
});

export const producer = kafka.producer();

// Connect to Kafka when server starts
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
