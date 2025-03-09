import { Kafka } from "kafkajs";
import logger from "../../config/logger";
import {
  ActivityType,
  activityWeights,
  UserActivity,
} from "../../models/userActivity.model";
import { redisService } from "../../config/redis";
import { UserInterest } from "../../models/userInterest.model";

const kafka = new Kafka({
  clientId: "recommendation-service",
  brokers: process.env.KAFKA_BROKERS?.split(",") || ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "recommendation-service-activity" });

const ACTIVITY_TOPIC = "user.activity";

export const startActivityConsumer = async (): Promise<void> => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: ACTIVITY_TOPIC, fromBeginning: false });

    logger.info("Activity consumer connected and subscribed to topics");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;

          const activityData = JSON.parse(message.value.toString());

          // Process the activity
          await processUserActivity(activityData);
        } catch (error) {
          logger.error("Error processing activity message", {
            topic,
            partition,
            error,
          });
        }
      },
    });
  } catch (error) {
    logger.error("Error starting activity consumer", error);
    // Retry connection after delay
    setTimeout(startActivityConsumer, 5000);
  }
};

// Shutdown consumer gracefully
export const stopActivityConsumer = async (): Promise<void> => {
  try {
    await consumer.disconnect();
  } catch (error) {
    logger.error("Error disconnecting activity consumer", error);
  }
};

// Process incoming user activity
async function processUserActivity(data: any): Promise<void> {
  const { userId, productId, categoryId, activityType, timestamp, metadata } =
    data;

  if (!userId || !activityType) {
    logger.warn("Invalid activity data received", { data });
    return;
  }

  try {
    // Get the weight for this activity type
    const activityEnum = activityType as ActivityType;
    const weight = activityWeights[activityEnum] || 1;

    // Store in MongoDB
    const activity = new UserActivity({
      userId,
      productId,
      categoryId,
      activityType: activityEnum,
      weight,
      timestamp: new Date(timestamp),
      metadata,
    });

    await activity.save();

    // Store in Redis for fast access
    await redisService.storeUserActivity(userId, {
      productId,
      categoryId,
      activityType: activityEnum,
      timestamp,
      weight,
      metadata,
    });

    // Update user interests based on this activity
    await updateUserInterests(userId);
  } catch (error) {
    logger.error("Error saving user activity", { userId, activityType, error });
  }
}

// Update user interests based on recent activities
export async function updateUserInterests(userId: string): Promise<void> {
  try {
    // Get recent activities from MongoDB (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activities = await UserActivity.find({
      userId,
      timestamp: { $gte: thirtyDaysAgo },
    }).sort({ timestamp: -1 });

    // Calculate interest scores for products
    const productScores: Record<string, { score: number; lastSeen: Date }> = {};

    // Calculate interest scores for categories
    const categoryScores: Record<string, { score: number; lastSeen: Date }> =
      {};

    for (const activity of activities) {
      const daysSinceActivity =
        (Date.now() - activity.timestamp.getTime()) / (1000 * 60 * 60 * 24);

      // Apply decay factor based on recency
      const decayFactor = Math.exp(-0.05 * daysSinceActivity); // Exponential decay
      const interestScore = activity.weight * decayFactor;

      // Update product scores
      if (activity.productId) {
        if (!productScores[activity.productId]) {
          productScores[activity.productId] = {
            score: 0,
            lastSeen: activity.timestamp,
          };
        }

        productScores[activity.productId].score += interestScore;

        // Update last seen if more recent
        if (activity.timestamp > productScores[activity.productId].lastSeen) {
          productScores[activity.productId].lastSeen = activity.timestamp;
        }
      }

      // Update category scores
      if (activity.categoryId) {
        if (!categoryScores[activity.categoryId]) {
          categoryScores[activity.categoryId] = {
            score: 0,
            lastSeen: activity.timestamp,
          };
        }

        categoryScores[activity.categoryId].score += interestScore;

        // Update last seen if more recent
        if (activity.timestamp > categoryScores[activity.categoryId].lastSeen) {
          categoryScores[activity.categoryId].lastSeen = activity.timestamp;
        }
      }
    }

    // Store product interests in MongoDB
    const productInterestOps = Object.entries(productScores).map(
      ([productId, data]) => {
        return {
          updateOne: {
            filter: { userId, interestType: "product", itemId: productId },
            update: {
              $set: {
                score: data.score,
                lastUpdated: new Date(),
              },
            },
            upsert: true,
          },
        };
      }
    );

    if (productInterestOps.length > 0) {
      await UserInterest.bulkWrite(productInterestOps);
    }

    // Store category interests in MongoDB
    const categoryInterestOps = Object.entries(categoryScores).map(
      ([categoryId, data]) => {
        return {
          updateOne: {
            filter: { userId, interestType: "category", itemId: categoryId },
            update: {
              $set: {
                score: data.score,
                lastUpdated: new Date(),
              },
            },
            upsert: true,
          },
        };
      }
    );

    if (categoryInterestOps.length > 0) {
      await UserInterest.bulkWrite(categoryInterestOps);
    }

    // Store in Redis for fast access
    // Just store the scores without the lastSeen data
    const productInterests: Record<string, number> = {};
    Object.entries(productScores).forEach(([productId, data]) => {
      productInterests[productId] = data.score;
    });

    const categoryInterests: Record<string, number> = {};
    Object.entries(categoryScores).forEach(([categoryId, data]) => {
      categoryInterests[categoryId] = data.score;
    });

    await redisService.storeUserInterests(userId, "product", productInterests);
    await redisService.storeUserInterests(
      userId,
      "category",
      categoryInterests
    );

    logger.info("Updated user interests", {
      userId,
      productCount: Object.keys(productScores).length,
      categoryCount: Object.keys(categoryScores).length,
    });
  } catch (error) {
    logger.error("Error updating user interests", { userId, error });
  }
}
