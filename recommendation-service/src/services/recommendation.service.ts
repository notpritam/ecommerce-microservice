import { ProductServiceClient } from "../clients/product.client";
import logger from "../config/logger";
import { redisService } from "../config/redis";
import { producer } from "../kafka/consumer";
import Recommendation from "../models/recommendation.model";
import { UserInterest } from "../models/userInterest.model";

const productServiceClient = new ProductServiceClient();

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

export class RecommendationService {
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<RecommendedProduct[]> {
    try {
      console.log("Generating personalized recommendations", { userId });
      const interestBasedRecommendations =
        await this.getInterestBasedRecommendations(userId, limit);

      console.log("interestBasedRecommendations", interestBasedRecommendations);

      const recentlyViewedRecommendations =
        await this.getRecentlyViewedRecommendations(userId, limit);
      // Strategy 3: Get recommendations based on similar users (collaborative filtering)

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

  // Generating User Recommendations Based on their Interests
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

      // TODO : Link with other service to send the data

      const response = await productServiceClient.getProducts({
        categories,
        limit: limit * 2,
      });

      if (!response.data || !response.success) {
        return [];
      }
      // Step 4: Check if products have been recommended recently
      const products: any[] = response.data;
      const filteredProducts: RecommendedProduct[] = [];

      for (const product of products) {
        // Check if we already recommended this product recently
        const wasRecentlySent = await redisService.wasRecommendationSent(
          userId,
          product.id
        );

        if (!wasRecentlySent) {
          // Calculate a recommendation score based on category interests
          // Find the highest score among the product's categories
          let highestCategoryScore = 0;
          let matchedCategory = "";

          // Ensure product.categories is an array before processing
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

          const score = highestCategoryScore * 0.8; // Weigh category interest as 80% of score

          filteredProducts.push({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl,
            categories: productCategories, // Use the categories array
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

      return filteredProducts; // Fixed: Was returning empty array []
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
      // Get recently viewed product IDs from Redis
      const recentlyViewedIds = await redisService.getRecentlyViewedProducts(
        userId
      );
      if (recentlyViewedIds.length === 0) {
        return [];
      }
      // Get product details from product service

      const response = await productServiceClient.getProductsByIds(
        recentlyViewedIds
      );

      if (!response.data || !response.success) {
        return [];
      }
      const products: any[] = response.data;

      const recommendations: RecommendedProduct[] = [];
      // Calculate recency-based scores (products viewed more recently get higher scores)
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        // Check if we already recommended this product recently
        const wasRecentlySent = await redisService.wasRecommendationSent(
          userId,
          product.id
        );
        if (!wasRecentlySent) {
          // Recency score: products at the beginning of the array are more recent
          const recencyScore =
            (recentlyViewedIds.length - i) / recentlyViewedIds.length;
          // Base score is between 0.5-1.0 based on recency
          const score = 0.5 + recencyScore * 0.5;

          // Ensure product.categories is an array
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
            categories: productCategories, // Use categories array instead of categoryId
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

  async processRecommendationTask(taskData: {
    maxRecommendations: number;
    includePriceDrops: boolean;
    taskId: string;
  }): Promise<{
    success: boolean;
    processedUsers: number;
    totalRecommendations: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let processedUsers = 0;
    let totalRecommendations = 0;

    try {
      logger.info("Processing scheduled recommendation task", { taskData });

      // 1. Get all users who have opted in to receive recommendations
      const userIds = await this.getUsersEligibleForRecommendations();

      if (!userIds.length) {
        logger.info("No eligible users found for recommendations");
        return {
          success: true,
          processedUsers: 0,
          totalRecommendations: 0,
          errors: [],
        };
      }

      logger.info(`Found ${userIds.length} users eligible for recommendations`);

      for (const userId of userIds) {
        try {
          // Generate recommendations for this user
          const recommendations = await this.getPersonalizedRecommendations(
            userId,
            taskData.maxRecommendations
          );

          if (recommendations.length > 0) {
            // Store recommendations in database
            const storedRecommendations = await this.storeRecommendations(
              userId,
              recommendations,
              taskData.taskId
            );

            // Mark these recommendations as sent to avoid duplicates in future
            for (const rec of recommendations) {
              // await redisService.markRecommendationSent(userId, rec.id);
            }

            // Send to notification queue
            await this.sendToNotificationQueue(
              producer,
              userId,
              storedRecommendations
            );

            totalRecommendations += recommendations.length;
            processedUsers++;
            logger.info(
              `Generated ${recommendations.length} recommendations for user ${userId}`
            );
          } else {
            logger.info(`No recommendations generated for user ${userId}`);
          }
        } catch (error: any) {
          const errorMessage = `Error processing recommendations for user ${userId}: ${error.message}`;
          logger.error(errorMessage, { error });
          errors.push(errorMessage);
        }
      }

      await producer.disconnect();

      return {
        success: true,
        processedUsers,
        totalRecommendations,
        errors,
      };
    } catch (error: any) {
      const errorMessage = `Failed to process recommendation task: ${error.message}`;
      logger.error(errorMessage, { error, taskData });
      errors.push(errorMessage);

      return {
        success: false,
        processedUsers,
        totalRecommendations,
        errors,
      };
    }
  }

  private async getUsersEligibleForRecommendations(): Promise<string[]> {
    try {
      const response = await fetch(
        `${process.env.USER_SERVICE_URL}/api/users/eligible-for-recommendations`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch eligible users: ${response.statusText}`
        );
      }

      const data: any = await response.json();
      return data.userIds || [];
    } catch (error) {
      logger.error("Error fetching eligible users", { error });
      return [];
    }
  }

  private async storeRecommendations(
    userId: string,
    recommendations: RecommendedProduct[],
    taskId: string
  ): Promise<any[]> {
    const storedRecommendations = [];

    for (const rec of recommendations) {
      const recommendation = new Recommendation({
        userId,
        productId: rec.id,
        score: rec.score,
        reason: rec.reason,
        taskId,
        createdAt: new Date(),
        productDetails: {
          name: rec.name,
          price: rec.price,
          imageUrl: rec.imageUrl,
          categories: rec.categories,
        },
      });

      const saved = await recommendation.save();
      storedRecommendations.push(saved);
    }

    return storedRecommendations;
  }

  private async sendToNotificationQueue(
    producer: any,
    userId: string,
    recommendations: any[]
  ): Promise<void> {
    const notificationPayload = {
      type: "recommendation",
      userId,
      timestamp: new Date().toISOString(),
      content: {
        title: "Products Recommended For You",
        body: `We found ${recommendations.length} products you might like!`,
        recommendations: recommendations.map((rec) => ({
          recommendationId: rec._id.toString(),
          productId: rec.productId,
          productName: rec.productDetails.name,
          reason: rec.reason,
          imageUrl: rec.productDetails.imageUrl,
          price: rec.productDetails.price,
        })),
      },
    };

    await producer.send({
      topic: "notification.created",
      messages: [
        {
          key: `recommendation-${userId}`,
          value: JSON.stringify(notificationPayload),
        },
      ],
    });

    logger.info(
      `Sent ${recommendations.length} recommendations to notification queue for user ${userId}`
    );
  }
}

const recommendationService = new RecommendationService();

export default recommendationService;
