import { Request, Response } from "express";
import { UserActivity } from "../models/userActivity.model";
import { UserInterest } from "../models/userInterest.model";
import logger from "../config/logger";
import { RecommendationGenerator } from "../services/recommendation.service";

export interface IApiResponse<T> {
  data: T;
  error: string;
  success: boolean;
}

class RecommendationController {
  private recommendationGenerator: RecommendationGenerator;
  constructor() {
    this.recommendationGenerator = new RecommendationGenerator();
  }

  async getUserActivities(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;

      // Get user activities from the database

      const userActivities = await UserActivity.find({
        userId,
      });

      res.status(200).json({
        data: userActivities,
        error: "",
        success: true,
      });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async storeUserActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const userActivity = req.body;

      // Store user activity in the database

      const newUserActivity = new UserActivity({
        ...userActivity,
        userId,
      });

      await newUserActivity.save();

      res.status(200).json({
        data: newUserActivity,
        error: "",
        success: true,
      });
    } catch (error: any) {
      logger.error("Error tracking activity", error.message);
      res.status(500).json({
        data: null,
        error: error.message,
        success: false,
      });
    }
  }

  async getUserInterests(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;

      // Get user interests from the database

      const userInterests = await UserInterest.find({
        userId,
      });

      res.status(200).json({
        data: userInterests,
        error: "",
        success: true,
      });
    } catch (error: any) {
      logger.error("Error fetching user interests", error.message);
      res.status(500).json({
        data: [],
        error: error.message,
        success: false,
      });
    }
  }

  async getUserRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;

      if (!userId) {
        throw new Error("User ID is required");
      }

      const userRecommendations =
        await this.recommendationGenerator.getPersonalizedRecommendations(
          userId,
          10
        );

      res.status(200).json({
        data: userRecommendations,
        error: "",
        success: true,
      });
    } catch (error: any) {
      logger.error("Error fetching user recommendations", error.message);
      res.status(500).json({
        data: [],
        error: error.message,
        success: false,
      });
    }
  }
}

const recommendationController = new RecommendationController();

export default recommendationController;
