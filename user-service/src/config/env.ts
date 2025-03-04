import dotenv from "dotenv";

dotenv.config();

interface IEnv {
  services: {
    orderServiceURL: string;
    productServiceURL: string;
    notificationServiceURL: string;
  };
}

const ENV: IEnv = {
  services: {
    orderServiceURL: "",
    productServiceURL: "",
    notificationServiceURL:
      process.env.NOTIFICATION_SERVICE_URL ||
      "http://notification-service:3002",
  },
};

export default ENV;
