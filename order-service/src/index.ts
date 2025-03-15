import express from "express";
import ENV from "./config/env";
import connectDB from "./config/db";
import logger from "./config/logger";
import { connectProducer } from "./config/kafka";
import orderRouter from "./routes/order.router";
import { createDemoOrders } from "./utils/demo";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Order Service is running");
});

app.use("/api/order", orderRouter);

const startServer = async () => {
  try {
    await connectDB();
    // await connectProducer();
    app.listen(ENV.port, () => {
      logger.info("Order Service Server running on port " + ENV.port);
    });

    // this will help in creating demo orders in db which can be used for testing

    // await createDemoOrders(
    //   "http://user-service:3001/api/users",
    //   "http://product-service:3004/api/products",
    //   5
    // );
  } catch (error) {
    logger.error("Error starting activity consumer", error);
  }
};

startServer();
