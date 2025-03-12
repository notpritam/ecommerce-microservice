import { producer } from "../../config/kafka";
import logger from "../../config/logger";
import {
  AuthenticationError,
  UserInputError,
} from "../../middleware/errorHandler";

const ACTIVITY_TOPIC = "user.activity";

export const activityResolvers = {
  Mutation: {
    trackActivity: async (_: any, { input }: any, context: any) => {
      if (!context.user) {
        throw new AuthenticationError(
          "You must be logged in to track activity"
        );
      }

      const { productId, searchQuery, activityType, metadata, categories } =
        input;

      const userId = context.user.id;

      if (activityType === "VIEW_PRODUCT" && !productId) {
        throw new UserInputError(
          "productId is required for VIEW_PRODUCT activity"
        );
      }

      if (activityType === "SEARCH" && !searchQuery) {
        throw new UserInputError("searchQuery is required for SEARCH activity");
      }

      try {
        const activityPayload = {
          userId,
          productId,
          categories,
          searchQuery,
          activityType,
          timestamp: Date.now(),
          metadata: metadata || {},
        };

        await producer.send({
          topic: ACTIVITY_TOPIC,
          messages: [
            {
              key: userId,
              value: JSON.stringify(activityPayload),
            },
          ],
        });

        return {
          success: true,
          message: "Activity tracked successfully",
        };
      } catch (error) {
        logger.error("Error tracking activity", {
          userId,
          activityType,
          error,
        });

        return {
          success: false,
          message: "Failed to track activity",
        };
      }
    },
  },

  Query: {
    userRecentActivities: async (_: any, { limit = 10 }: any, context: any) => {
      if (!context.user) {
        throw new AuthenticationError(
          "You must be logged in to view your activities"
        );
      }

      const userId = context.user.id;

      try {
        // Call recommendation service to get recent activities
        const response = await context.dataSources.recommendationAPI.get(
          `/users/${userId}/activities`,
          { limit }
        );

        return response.activities || [];
      } catch (error) {
        logger.error("Error fetching user activities", { userId, error });
        return [];
      }
    },
  },

  UserActivity: {
    product: async (parent: any, _: any, context: any) => {
      if (!parent.productId) return null;

      try {
        return await context.dataSources.productAPI.get(
          `/products/${parent.productId}`
        );
      } catch (error) {
        logger.error("Error fetching product for activity", {
          productId: parent.productId,
          error,
        });
        return null;
      }
    },

    category: async (parent: any, _: any, context: any) => {
      if (!parent.categoryId) return null;

      try {
        return await context.dataSources.productAPI.get(
          `/categories/${parent.categoryId}`
        );
      } catch (error) {
        logger.error("Error fetching category for activity", {
          categoryId: parent.categoryId,
          error,
        });
        return null;
      }
    },
  },
};
