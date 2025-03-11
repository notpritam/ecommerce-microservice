import express from "express";
import { startActivityConsumer } from "./kafka/consumers/activity.consumer";
import ENV from "./config/env";
import connectDB from "./config/db";
import logger from "./config/logger";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const startServer = async () => {
  try {
    await connectDB();
    await startActivityConsumer();
    app.listen(ENV.port, () => {
      logger.info("Server running on port " + ENV.port);
    });
  } catch (error) {
    logger.error("Error starting activity consumer", error);
  }
};

startServer();
