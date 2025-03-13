import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.send("Order Service is running");
});

export default router;
