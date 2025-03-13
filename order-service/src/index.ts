import express from "express";
import ENV from "./config/env";
import connectDB from "./config/db";
import logger from "./config/logger";
import { connectProducer } from "./config/kafka";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const startServer = async () => {
  try {
    await connectDB();
    await connectProducer();
    app.listen(ENV.port, () => {
      logger.info("Order Service Server running on port " + ENV.port);
    });
  } catch (error) {
    logger.error("Error starting activity consumer", error);
  }
};

startServer();
