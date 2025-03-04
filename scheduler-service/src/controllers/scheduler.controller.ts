// scheduler-service/src/controllers/scheduler.controller.ts

import { Request, Response } from "express";
import {
  createScheduler,
  deleteScheduler,
  findAllSchedulers,
  updateScheduler,
} from "../repositories/scheduler.repositories";
import logger from "../config/logger";

export const getAllSchedulers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const schedulers = await findAllSchedulers();
    res.json(schedulers);
  } catch (error) {
    logger.error("Error fetching schedulers:", error);
    res.status(500).json({ error: "Failed to fetch schedulers" });
  }
};

export const createNewScheduler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const scheduler = await createScheduler(req.body);
    res.status(201).json(scheduler);
  } catch (error) {
    logger.error("Error creating scheduler:", error);
    res.status(500).json({ error: "Failed to create scheduler" });
  }
};

export const updateExistingScheduler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Scheduler ID is required" });
      return;
    }

    const updatedScheduler = await updateScheduler(id as string, req.body);

    if (!updatedScheduler) {
      res.status(404).json({ error: "Scheduler not found" });
      return;
    }

    res.json(updatedScheduler);
  } catch (error) {
    logger.error("Error updating scheduler:", error);
    res.status(500).json({ error: "Failed to update scheduler" });
  }
};

export const deleteExistingScheduler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Scheduler ID is required" });
      return;
    }

    const deletedScheduler = await deleteScheduler(id as string);

    if (!deletedScheduler) {
      res.status(404).json({ error: "Scheduler not found" });
      return;
    }

    res.json({ message: "Scheduler deleted successfully" });
  } catch (error) {
    logger.error("Error deleting scheduler:", error);
    res.status(500).json({ error: "Failed to delete scheduler" });
  }
};
