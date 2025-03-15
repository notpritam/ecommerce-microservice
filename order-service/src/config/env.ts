import dotenv from "dotenv";

dotenv.config();

interface IEnv {
  services: {
    orderServiceURL: string;
    productServiceURL: string;
    notificationServiceURL: string;
    userServiceURL: string;
  };
  redis: {
    host: string;
    port: number;
    password: string;
  };
  jwt_secret: string;
  jwt_expiration: string;
  refresh_token_expiration: number;
  mongodb: string;
  port?: number;
  kafka_brokers: string;
  kafka_client_id: string;
  kafka_group_id: string;
}

// TODO : update the env to include the api route as in the ENV

const ENV: IEnv = {
  services: {
    orderServiceURL: "",
    productServiceURL:
      process.env.PRODUCT_SERVICE_URL || "http://product-service:3002",
    notificationServiceURL:
      "http://notification-service:3002/api/notifications",
    userServiceURL: process.env.USER_SERVICE_URL || "http://user-service:3001",
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || "",
  },
  jwt_secret:
    process.env.JWT_SECRET || "your_jwt_secret_key_change_in_production",
  jwt_expiration: process.env.JWT_EXPIRATION || "24h",
  refresh_token_expiration: parseInt(
    process.env.REFRESH_TOKEN_EXPIRATION || "2592000"
  ),
  mongodb: process.env.MONGO_URI || "mongodb://mongo-order:27017/order-db",
  port: parseInt(process.env.PORT || "3005"),
  kafka_brokers: process.env.KAFKA_BROKERS || "localhost:9092",
  kafka_client_id: process.env.KAFKA_CLIENT_ID || "notification-service",
  kafka_group_id:
    process.env.KAFKA_GROUP_ID || "notification-service-tasks-group",
};

export default ENV;
