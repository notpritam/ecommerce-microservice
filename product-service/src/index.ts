import express from "express";
import ENV from "./config/env";
import connectDB from "./config/db";
import productRouter from "./routes/product.router";

const app = express();

const PORT = ENV.port || 3004;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/products", productRouter);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Notification service is running on the port ${PORT}`);
    });
  } catch (error) {}
};

startServer();
