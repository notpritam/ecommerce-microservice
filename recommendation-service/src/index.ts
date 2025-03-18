import express from "express";
import ENV from "./config/env";
import connectDB from "./config/db";
import logger from "./config/logger";
import recommendationRouter from "./routes/recommendation.routes";
import { startConsumer } from "./kafka/consumer";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/recommendation", recommendationRouter);

const startServer = async () => {
  try {
    await connectDB();
    await startConsumer();
    app.listen(ENV.port, () => {
      logger.info("Server running on port " + ENV.port);
    });
  } catch (error) {
    logger.error("Error starting activity consumer", error);
  }
};

startServer();
