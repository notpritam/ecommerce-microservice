import express from "express";
import recommendationController from "../controllers/recommendation.controller";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.get(
  "/users/:userId/activities",
  recommendationController.getUserActivities
);
router.post(
  "/users/:userId/activities",
  recommendationController.storeUserActivity
);

router.get(
  "/users/:userId/interests",
  recommendationController.getUserInterests
);

router.get(
  "/users/:userId/recommendations",
  recommendationController.getUserRecommendations
);

export default router;
