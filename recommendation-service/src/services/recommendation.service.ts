import { ProductServiceClient } from "../clients/product.client";
import logger from "../config/logger";
import { redisService } from "../config/redis";
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
}

const recommendationService = new RecommendationService();

export default recommendationService;
