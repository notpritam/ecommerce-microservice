import { ProductServiceClient } from "../clients/product.client";
import logger from "../config/logger";
import { UserInterest } from "../models/userInterest.model";

const productServiceClient = new ProductServiceClient();

interface RecommendedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  score: number;
  reason: string;
}

export class RecommendationGenerator {
  // async getPersonalizedRecommendations(
  //   userId: string,
  //   limit: number = 10
  // ): Promise<RecommendedProduct[]> {
  //   try {
  //     const interestBasedRecommendations =
  //       await this.getInterestBasedRecommendations(userId, limit);

  //     // Strategy 2: Get recently viewed but not purchased products
  //     const recentlyViewedRecommendations =
  //       await this.getRecentlyViewedRecommendations(userId, limit);

  //     // Strategy 3: Get recommendations based on similar users (collaborative filtering)
  //     // This would typically call a more complex recommender system
  //     // For this example, we'll skip implementing this

  //     // Combine all recommendations, removing duplicates
  //     const allRecommendations = [
  //       ...interestBasedRecommendations,
  //       ...recentlyViewedRecommendations,
  //     ];

  //     // Remove duplicates by product ID
  //     const uniqueRecommendations = Array.from(
  //       new Map(allRecommendations.map((item) => [item.id, item])).values()
  //     );

  //     // Sort by score (highest first)
  //     uniqueRecommendations.sort((a, b) => b.score - a.score);

  //     // Return top N recommendations
  //     return uniqueRecommendations.slice(0, limit);
  //   } catch (error) {
  //     logger.error("Error generating personalized recommendations", {
  //       userId,
  //       error,
  //     });
  //     return [];
  //   }
  // }

  //   Generating User Recommendations Based on their Interests

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

      const categoryIds = topCategoryInterests.map(
        (interest) => interest.itemId
      );
      const categoryScores: Record<string, number> = {};

      topCategoryInterests.forEach((interest) => {
        categoryScores[interest.itemId] = interest.score;
      });

      // TODO : Link with other service to send the data

      // Step 3: Get products from product service
      //   const response = await axios.get(`${PRODUCT_SERVICE_URL}/products`, {
      //     params: {
      //       categoryIds: categoryIds.join(","),
      //       limit: limit * 2, // Get more than needed to allow for filtering
      //     },
      //   });

      // if (!response.data || !response.data.products) {
      //   return [];
      // }

      // // Step 4: Check if products have been recommended recently
      // const products: any[] = response.data.products;
      // const filteredProducts: RecommendedProduct[] = [];

      // for (const product of products) {
      //   // Check if we already recommended this product recently
      //   const wasRecentlySent = await redisService.wasRecommendationSent(
      //     userId,
      //     product.id
      //   );

      //   if (!wasRecentlySent) {
      //     // Calculate a recommendation score based on category interest
      //     const categoryScore = categoryScores[product.categoryId] || 0;
      //     const score = categoryScore * 0.8; // Weigh category interest as 80% of score

      //     filteredProducts.push({
      //       id: product.id,
      //       name: product.name,
      //       description: product.description,
      //       price: product.price,
      //       imageUrl: product.imageUrl,
      //       categoryId: product.categoryId,
      //       score,
      //       reason: "Based on your category interests",
      //     });

      //     if (filteredProducts.length >= limit) {
      //       break;
      //     }
      //   }
      // }

      return [];
    } catch (error) {
      logger.error("Error getting interest-based recommendations", {
        userId,
        error,
      });
      return [];
    }
  }

  // private async getRecentlyViewedRecommendations(
  //   userId: string,
  //   limit: number
  // ): Promise<RecommendedProduct[]> {
  //   try {
  //     // Get recently viewed product IDs from Redis
  //     const recentlyViewedIds = await redisService.getRecentlyViewedProducts(
  //       userId
  //     );

  //     if (recentlyViewedIds.length === 0) {
  //       return [];
  //     }

  //     // Get product details from product service
  //     const response = await axios.get(
  //       `${PRODUCT_SERVICE_URL}/products/batch`,
  //       {
  //         params: {
  //           ids: recentlyViewedIds.join(","),
  //         },
  //       }
  //     );

  //     if (!response.data || !response.data.products) {
  //       return [];
  //     }

  //     const products: any[] = response.data.products;
  //     const recommendations: RecommendedProduct[] = [];

  //     // Calculate recency-based scores (products viewed more recently get higher scores)
  //     for (let i = 0; i < products.length; i++) {
  //       const product = products[i];

  //       // Check if we already recommended this product recently
  //       const wasRecentlySent = await redisService.wasRecommendationSent(
  //         userId,
  //         product.id
  //       );

  //       if (!wasRecentlySent) {
  //         // Recency score: products at the beginning of the array are more recent
  //         const recencyScore =
  //           (recentlyViewedIds.length - i) / recentlyViewedIds.length;
  //         // Base score is between 0.5-1.0 based on recency
  //         const score = 0.5 + recencyScore * 0.5;

  //         recommendations.push({
  //           id: product.id,
  //           name: product.name,
  //           description: product.description,
  //           price: product.price,
  //           imageUrl: product.imageUrl,
  //           categoryId: product.categoryId,
  //           score,
  //           reason: "Recently viewed",
  //         });

  //         if (recommendations.length >= limit) {
  //           break;
  //         }
  //       }
  //     }

  //     return recommendations;
  //   } catch (error) {
  //     logger.error("Error getting recently viewed recommendations", {
  //       userId,
  //       error,
  //     });
  //     return [];
  //   }
  // }
}
