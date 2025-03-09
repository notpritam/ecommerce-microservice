import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.send("Product service is running");
});

export default router;
