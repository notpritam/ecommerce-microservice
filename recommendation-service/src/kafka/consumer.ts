import { Kafka } from "kafkajs";
import logger from "../config/logger";
import {
  ActivityType,
  activityWeights,
  UserActivity,
} from "../models/userActivity.model";
import { redisService } from "../config/redis";
import { UserInterest } from "../models/userInterest.model";
import ENV from "../config/env";

const kafka = new Kafka({
  clientId: ENV.kafka_client_id,
  brokers: ENV.kafka_brokers,
});

const consumer = kafka.consumer({ groupId: "recommendation-service-activity" });
const producer = kafka.producer();
producer.connect();

const ACTIVITY_TOPIC = "user.activity";
const RECOMMENDATION = "recommendation.process";

export const startConsumer = async (): Promise<void> => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: ACTIVITY_TOPIC, fromBeginning: false });
    await consumer.subscribe({
      topic: RECOMMENDATION,
      fromBeginning: false,
    });

    logger.info(" Recommendation consumer connected and subscribed to topics");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;

          const data = JSON.parse(message.value.toString());

          if (topic == ACTIVITY_TOPIC) {
            logger.info("Received activity message", { data });
            await processUserActivity(data);
          } else if (topic == RECOMMENDATION) {
            logger.info("Received recommendation", data);
          }
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
    setTimeout(startConsumer, 5000);
  }
};

export const stopConsumer = async (): Promise<void> => {
  try {
    await consumer.disconnect();
  } catch (error) {
    logger.error("Error disconnecting activity consumer", error);
  }
};

async function processUserActivity(data: any): Promise<void> {
  const { userId, productId, categories, activityType, timestamp, metadata } =
    data;

  if (!userId || !activityType) {
    logger.warn("Invalid activity data received", { data });
    return;
  }

  try {
    const activityEnum = activityType as ActivityType;
    const weight = activityWeights[activityEnum] || 1;

    const activity = new UserActivity({
      userId,
      productId,
      categories,
      activityType: activityEnum,
      weight,
      timestamp: new Date(timestamp),
      metadata,
    });

    await activity.save();

    await redisService.storeUserActivity(userId, {
      productId,
      categories,
      activityType: activityEnum,
      timestamp,
      weight,
      metadata,
    });

    await updateUserInterests(userId);
  } catch (error) {
    logger.error("Error saving user activity", { userId, activityType, error });
  }
}

export async function updateUserInterests(userId: string): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activities = await UserActivity.find({
      userId,
      timestamp: { $gte: thirtyDaysAgo },
    }).sort({ timestamp: -1 });

    const productScores: Record<string, { score: number; lastSeen: Date }> = {};
    const categoryScores: Record<string, { score: number; lastSeen: Date }> =
      {};

    for (const activity of activities) {
      const daysSinceActivity =
        (Date.now() - activity.timestamp.getTime()) / (1000 * 60 * 60 * 24);

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

        //@ts-ignore
        productScores[activity.productId].score += interestScore;

        //@ts-ignore
        if (activity.timestamp > productScores[activity.productId].lastSeen) {
          //@ts-ignore
          productScores[activity.productId].lastSeen = activity.timestamp;
        }
      }

      // Update category scores - now handling categories as string[]
      if (activity.categories && Array.isArray(activity.categories)) {
        // Process each category in the array
        for (const category of activity.categories) {
          if (!categoryScores[category]) {
            categoryScores[category] = {
              score: 0,
              lastSeen: activity.timestamp,
            };
          }

          categoryScores[category].score += interestScore;

          // Update last seen if more recent
          if (activity.timestamp > categoryScores[category].lastSeen) {
            categoryScores[category].lastSeen = activity.timestamp;
          }
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

export { producer };
