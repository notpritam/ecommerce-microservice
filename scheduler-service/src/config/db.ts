import mongoose from "mongoose";
import ENV from "./env";
import logger from "./logger";

const MONGO_URI = ENV.mongodb;

const connectDB = async () => {
  try {
    logger.info("Connecting to MongoDB...", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
