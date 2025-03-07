import express from "express";
import ENV from "./config/env";
import notificationRouter from "./routes/notification.route";
import connectDB from "./config/db";

const app = express();

const PORT = ENV.port || 3002;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/notifications", notificationRouter);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Notification service is running on the port ${PORT}`);
    });
  } catch (error) {}
};

startServer();
