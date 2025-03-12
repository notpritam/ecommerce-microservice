import express from "express";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.get("/users/:userId/activities", (req, res) => {});
router.post("/users/:userId/activities", (req, res) => {});

router.get("/users/:userId/interests", (req, res) => {});

router.get("/users/:userId/recommendations", (req, res) => {});

export default router;
