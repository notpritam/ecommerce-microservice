import dotenv from "dotenv";

dotenv.config();

interface IEnv {
  services: {
    orderServiceURL: string;
    productServiceURL: string;
    notificationServiceURL: string;
  };
  mongodb: string;
  port?: number;
  kafka_brokers: string;
  kafka_client_id: string;
}

const ENV: IEnv = {
  services: {
    orderServiceURL: "",
    productServiceURL: "",
    notificationServiceURL:
      process.env.NOTIFICATION_SERVICE_URL ||
      "http://notification-service:3002",
  },
  mongodb: process.env.MONGO_URI || "mongodb://mongo-scheduler:27017/user-db",
  port: parseInt(process.env.PORT || "3001"),
  kafka_brokers: process.env.KAFKA_BROKERS || "localhost:9092",
  kafka_client_id: process.env.KAFKA_CLIENT_ID || "scheduler-service",
};

export default ENV;
