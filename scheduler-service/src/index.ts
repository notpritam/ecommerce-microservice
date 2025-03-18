import express from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import { Kafka } from "kafkajs";
import Redis from "ioredis";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cron from "node-cron";
import Scheduler, { ServiceType } from "./models/scheduler.model";
import connectDB from "./config/db";
import { Request, Response } from "express";
import { createDefaultTasks } from "./utils/helper";
import ENV from "./config/env";
import logger from "./config/logger";

interface Task {
  taskName: string;
  serviceType: ServiceType;
  cronExpression: string;
  enabled: boolean;
  data: {
    maxRecommendations: number;
    includePriceDrops: boolean;
  };
  id: string;
}

dotenv.config();

const app = express();
const port = ENV.port;

app.use(cors());
app.use(helmet());
app.use(express.json());

const kafka = new Kafka({
  clientId: ENV.kafka_client_id,
  brokers: [ENV.kafka_brokers],
});

const producer = kafka.producer();

const redisClient = new Redis({
  host: ENV.redis.host,
  port: ENV.redis.port,
});

const setupServer = async () => {
  try {
    await connectDB();

    await producer.connect();

    const server = createServer(app);
    server.listen(port, () => {
      logger.info(`Scheduler service listening on port ${port}`);

      initializeScheduler();
    });
  } catch (error) {
    logger.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

setupServer();

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "scheduler-service" });
});

app.get("/api/scheduler", async (req, res) => {
  try {
    const tasks = await Scheduler.find({});
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.post("/api/scheduler", async (req, res) => {
  try {
    const task = new Scheduler(req.body);
    await task.save();

    // Schedule the new task
    scheduleTask(task);

    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

app.put(
  "/api/scheduler/:id",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      const task = await Scheduler.findByIdAndUpdate(id, req.body, {
        new: true,
      });

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      scheduleTask(task);

      res.status(200).json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  }
);

app.delete(
  "/api/scheduler/:id",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      const task = await Scheduler.findByIdAndDelete(id);

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Stop the scheduled task
      if (scheduledTasks.has(id)) {
        scheduledTasks.get(id)?.stop();
        scheduledTasks.delete(id);
      }

      res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  }
);

const scheduledTasks = new Map();

const initializeScheduler = async () => {
  try {
    const count = await Scheduler.countDocuments();

    if (count === 0) {
      await createDefaultTasks();
    }

    const tasks = await Scheduler.find({ enabled: true });
    logger.info(`Found ${tasks.length} enabled tasks to schedule`);

    tasks.forEach((task) => {
      console.log("Task details", JSON.stringify(task, null, 2));
      scheduleTask(task);
    });
  } catch (error) {
    console.error("Error initializing scheduler:", error);
  }
};

const scheduleTask = (task: any) => {
  try {
    if (scheduledTasks.has(task.id)) {
      scheduledTasks.get(task.id).stop();
    }

    if (!task.enabled) {
      return;
    }

    const scheduledTask = cron.schedule(task.cronExpression, async () => {
      try {
        console.log(`Running task: ${task.taskName}`);

        task.lastRun = new Date();
        await task.save();

        await sendKafkaMessage(task);
      } catch (error) {
        console.error(`Error executing task ${task.taskName}:`, error);
      }
    });

    scheduledTasks.set(task.id, scheduledTask);

    console.log(
      `Scheduled task: ${task.taskName} with cron: ${task.cronExpression}`
    );
  } catch (error) {
    console.error(`Error scheduling task ${task.taskName}:`, error);
  }
};

const sendKafkaMessage = async (task: Task) => {
  let topic;

  switch (task.serviceType) {
    case "user":
      topic = "user.events";
      break;
    case "notification":
      topic = "notification.created";
      break;
    case "recommendation":
      topic = "recommendation.process";
      break;
    case "order":
      topic = "order.status";
      break;
    default:
      throw new Error(`Unknown service type: ${task.serviceType}`);
  }

  const message = {
    taskName: task.taskName,
    data: {
      ...task.data,
      taskId: task.id,
      serviceType: task.serviceType,
      timestamp: new Date().toISOString(),
    },
  };

  await producer.send({
    topic,
    messages: [
      {
        key: `${task.serviceType}-${task.taskName}-${Date.now()}`,
        value: JSON.stringify(message),
      },
    ],
  });

  console.log(`Sent message to Kafka topic ${topic} for task ${task.taskName}`);

  const redisKey = `scheduler:${task.serviceType}:${task.id}:${
    new Date().toISOString().split("T")[0]
  }`;
  await redisClient.setex(
    redisKey,
    86400 * 7,
    JSON.stringify({
      executed: true,
      timestamp: new Date().toISOString(),
    })
  );
};

const shutdown = async () => {
  console.log("Shutting down scheduler service...");

  for (const [_, task] of scheduledTasks) {
    task.stop();
  }

  await producer.disconnect();
  await redisClient.quit();
  await mongoose.connection.close();

  console.log("Scheduler service shut down gracefully");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
