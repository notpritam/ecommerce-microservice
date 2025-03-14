import { Request, Response } from "express";
import { UserActivity } from "../models/userActivity.model";
import { UserInterest } from "../models/userInterest.model";
import logger from "../config/logger";
import { ProductServiceClient } from "../clients/product.client";
import { redisService } from "../config/redis";
import Recommendation from "../models/recommendation.model";

export interface IApiResponse<T> {
  data: T;
  error: string;
  success: boolean;
}

interface RecommendedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categories: string[];
  score: number;
  reason: string;
}

class RecommendationController {
  private productServiceClient: ProductServiceClient;

  constructor() {
    this.productServiceClient = new ProductServiceClient();

    this.getUserActivities = this.getUserActivities.bind(this);
    this.storeUserActivity = this.storeUserActivity.bind(this);
    this.getUserInterests = this.getUserInterests.bind(this);
    this.getUserRecommendations = this.getUserRecommendations.bind(this);
  }

  async getUserActivities(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const userActivities = await UserActivity.find({
        userId,
      });
      res.status(200).json({
        data: userActivities,
        error: "",
        success: true,
      });
    } catch (error: any) {
      logger.error("Error fetching user activities", error.message);
      res.status(500).json({
        data: [],
        error: error.message,
        success: false,
      });
    }
  }

  async storeUserActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const userActivity = req.body;
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

      const recommendations = await this.getPersonalizedRecommendations(
        userId,
        10
      );

      for (const recommendation of recommendations) {
        await Recommendation.create({
          userId,
          products: [
            {
              productId: recommendation.id,
              score: recommendation.score,
              reason: recommendation.reason,
            },
          ],
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          isNotified: false,
        });
      }

      res.status(200).json({
        data: recommendations,
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

  private async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<RecommendedProduct[]> {
    try {
      const interestBasedRecommendations =
        await this.getInterestBasedRecommendations(userId, limit);

      const recentlyViewedRecommendations =
        await this.getRecentlyViewedRecommendations(userId, limit);

      const allRecommendations = [
        ...interestBasedRecommendations,
        ...recentlyViewedRecommendations,
      ];
      // Remove duplicates by product ID
      const uniqueRecommendations = Array.from(
        new Map(allRecommendations.map((item) => [item.id, item])).values()
      );
      // Sort by score (highest first)
      uniqueRecommendations.sort((a, b) => b.score - a.score);
      // Return top N recommendations
      return uniqueRecommendations.slice(0, limit);
    } catch (error) {
      logger.error("Error generating personalized recommendations", {
        userId,
        error,
      });
      return [];
    }
  }

  private async getInterestBasedRecommendations(
    userId: string,
    limit: number
  ): Promise<RecommendedProduct[]> {
    try {
      const topCategoryInterests = await UserInterest.find({
        userId,
        interestType: "category",
      })
        .sort({ score: -1 })
        .limit(5);

      console.log("topCategoryInterests", topCategoryInterests);

      if (topCategoryInterests.length === 0) {
        return [];
      }

      const categories = topCategoryInterests.map(
        (interest) => interest.itemId
      );

      const categoryScores: Record<string, number> = {};
      topCategoryInterests.forEach((interest) => {
        categoryScores[interest.itemId] = interest.score;
      });

      const response = await this.productServiceClient.getProducts({
        categories,
        limit: limit * 2,
      });

      if (!response.data || !response.success) {
        return [];
      }

      const products: any[] = response.data;
      const filteredProducts: RecommendedProduct[] = [];

      for (const product of products) {
        // Check if we already recommended this product recently
        const wasRecentlySent = await redisService.wasRecommendationSent(
          userId,
          product.id
        );

        if (!wasRecentlySent) {
          let highestCategoryScore = 0;
          let matchedCategory = "";

          const productCategories = Array.isArray(product.categories)
            ? product.categories
            : product.categoryId
            ? [product.categoryId]
            : [];

          for (const category of productCategories) {
            const score = categoryScores[category] || 0;
            if (score > highestCategoryScore) {
              highestCategoryScore = score;
              matchedCategory = category;
            }
          }

          const score = highestCategoryScore * 0.8;

          filteredProducts.push({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl,
            categories: productCategories,
            score,
            reason: matchedCategory
              ? `Based on your interest in ${matchedCategory}`
              : "Based on your category interests",
          });

          if (filteredProducts.length >= limit) {
            break;
          }
        }
      }

      return filteredProducts;
    } catch (error) {
      logger.error("Error getting interest-based recommendations", {
        userId,
        error,
      });
      return [];
    }
  }

  private async getRecentlyViewedRecommendations(
    userId: string,
    limit: number
  ): Promise<RecommendedProduct[]> {
    try {
      const recentlyViewedIds = await redisService.getRecentlyViewedProducts(
        userId
      );

      if (recentlyViewedIds.length === 0) {
        return [];
      }

      const response = await this.productServiceClient.getProductsByIds(
        recentlyViewedIds
      );

      if (!response.data || !response.success) {
        return [];
      }

      const products: any[] = response.data;
      const recommendations: RecommendedProduct[] = [];

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const wasRecentlySent = await redisService.wasRecommendationSent(
          userId,
          product.id
        );

        if (!wasRecentlySent) {
          const recencyScore =
            (recentlyViewedIds.length - i) / recentlyViewedIds.length;
          const score = 0.5 + recencyScore * 0.5;

          const productCategories = Array.isArray(product.categories)
            ? product.categories
            : product.categoryId
            ? [product.categoryId]
            : [];

          recommendations.push({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl,
            categories: productCategories,
            score,
            reason: "Recently viewed",
          });

          if (recommendations.length >= limit) {
            break;
          }
        }
      }

      return recommendations;
    } catch (error) {
      logger.error("Error getting recently viewed recommendations", {
        userId,
        error,
      });
      return [];
    }
  }
}

const recommendationController = new RecommendationController();
export default recommendationController;
