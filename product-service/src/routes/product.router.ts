import { Router } from "express";
import { ProductController } from "../controllers/product.controller";

const router = Router();

const productController = new ProductController();

router.get("/", productController.getProducts);

export default router;
