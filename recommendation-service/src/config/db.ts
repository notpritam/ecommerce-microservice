import mongoose from "mongoose";
import ENV from "./env";
import logger from "./logger";

const MONGO_URI = ENV.mongodb;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
