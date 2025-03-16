import express from "express";
import ENV from "./config/env";
import notificationRouter from "./routes/notification.route";
import connectDB from "./config/db";
import { initTaskConsumer } from "./kafka/consumers/task.consumer";
import { connectProducer } from "./config/kafka";

const app = express();

const PORT = ENV.port || 3002;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/notifications", notificationRouter);

const startServer = async () => {
  try {
    await connectDB();
    await initTaskConsumer();
    await connectProducer();
    app.listen(PORT, () => {
      console.log(`Notification service is running on the port ${PORT}`);
    });
  } catch (error) {}
};

startServer();
