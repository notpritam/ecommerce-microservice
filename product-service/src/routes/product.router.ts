import { Router } from "express";
import { ProductController } from "../controllers/product.controller";

const router = Router();

const productController = new ProductController();

router.get("/", productController.getProducts);
router.post("/", productController.getProductsByCategory);
router.get("/:id", productController.getProductById);
router.post("/by-ids", productController.getProductsByIds);

export default router;
