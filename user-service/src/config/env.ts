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
}

const ENV: IEnv = {
  services: {
    orderServiceURL: "",
    productServiceURL: "",
    notificationServiceURL:
      process.env.NOTIFICATION_SERVICE_URL ||
      "http://notification-service:3002",
  },
  mongodb: process.env.MONGODB || "mongodb://localhost:27017/user-db",
  port: parseInt(process.env.PORT || "3001"),
};

export default ENV;
