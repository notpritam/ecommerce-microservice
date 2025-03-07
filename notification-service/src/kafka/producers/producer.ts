import { Kafka, Producer } from "kafkajs";
import ENV from "../../config/env";
import logger from "../../config/logger";

class KafkaProducerService {
  private producer: Producer;
  private isConnected: boolean = false;

  constructor() {
    const kafka = new Kafka({
      clientId: ENV.kafka_client_id,
      brokers: ENV.kafka_brokers?.split(","),
      retry: {
        initialRetryTime: 300,
        retries: 10,
      },
    });

    this.producer = kafka.producer();
  }

  public async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.producer.connect();
        this.isConnected = true;
        logger.info("Kafka producer connected");
      }
    } catch (error) {
      logger.error("Error connecting to Kafka producer", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.producer.disconnect();
        this.isConnected = false;
        logger.info("Kafka producer disconnected");
      }
    } catch (error) {
      logger.error("Error disconnecting from Kafka producer", error);
      throw error;
    }
  }

  public async send({
    topic,
    messages,
  }: {
    topic: string;
    messages: any[];
  }): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages,
      });
      logger.info("Message sent to Kafka producer");
    } catch (error: any) {
      logger.error("Error sending message to Kafka producer", error);

      if (error.code === "ECONNREFUSED") {
        this.isConnected = false;
        await this.connect();
        await this.send({ topic, messages });
        logger.info("Message sent to Kafka producer");
      } else {
        throw error;
      }
    }
  }

  public async sendToDeadLetterQueue({
    originalTopic,
    failedMessage,
    error,
  }: {
    originalTopic: string;
    failedMessage: any;
    error: any;
  }): Promise<void> {
    try {
      const event = {
        originalTopic,
        failedMessage,
        error: {
          message: error.message,
          stack: error.stack,
        },
        timestamp: new Date().toISOString(),
      };

      await this.send({
        topic: "dead-letter.notification",
        messages: [
          {
            key: `${originalTopic}-${Date.now()}`,
            value: JSON.stringify(event),
          },
        ],
      });
      logger.info("Message sent to dead letter queue");
    } catch (error) {
      logger.error("Error sending message to dead letter queue", error);
      throw error;
    }
  }
}

const kafkaProducer = new KafkaProducerService();

export default kafkaProducer;
