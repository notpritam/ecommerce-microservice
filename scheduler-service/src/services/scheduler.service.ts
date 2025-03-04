import { CronJob } from "cron";
import {
  findDueSchedulers,
  updateSchedulerRuntime,
} from "../repositories/scheduler.repositories";
import logger from "../config/logger";
import { dispatchTask } from "../kafka/producers/task.producer";

const parseExpression = require("cron-parser").parseExpression;

const runningJobs = new Map<string, CronJob>();

export const initializeScheduler = async (): Promise<void> => {
  try {
    const job = new CronJob("*/1 * * * *", async () => {
      await processScheduledTasks();
    });

    job.start();
    logger.info("Scheduler service initialized");
  } catch (error) {
    logger.error("Error initializing scheduler:", error);
    throw error;
  }
};

const processScheduledTasks = async (): Promise<void> => {
  try {
    const dueTasks = await findDueSchedulers();

    for (const task of dueTasks) {
      logger.info(`Processing scheduled task: ${task.taskName}`);

      const interval = parseExpression(task.cronExpression);
      const nextRun = interval.next().toDate();

      await updateSchedulerRuntime(task._id as string, new Date(), nextRun);

      await dispatchTask(task.serviceType, task.taskName, task.data);
    }
  } catch (error) {
    logger.error("Error processing scheduled tasks:", error);
  }
};

export const startScheduler = async (): Promise<void> => {
  try {
    await initializeScheduler();
  } catch (error) {
    logger.error("Failed to start scheduler:", error);
    throw error;
  }
};
