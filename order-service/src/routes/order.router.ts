import { Router } from "express";
import orderController from "../controllers/order.controller";

const router = Router();

router.get("/health", (req, res) => {
  res.send("Order Service is running");
});

router.get("/:id", orderController.getOrder);
router.post("/", orderController.createOrder);
router.put("/:id", orderController.updateOrder);
router.delete("/:id", orderController.deleteOrder);

export default router;
