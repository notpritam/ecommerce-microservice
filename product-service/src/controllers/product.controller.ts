import { Request, Response } from "express";
import Product from "../models/product.model";
import logger from "../config/logger";
export class ProductController {
  constructor() {}

  async getProducts(req: Request, res: Response) {
    try {
      console.log("Fetching products");
      const products = await Product.find();

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getProductsByCategory(req: Request, res: Response): Promise<void> {
    try {
      logger.info("Fetching products by category");
      const { categories, limit } = req.body.params || {};

      console.log("Categories:", categories);

      const products = await Product.find({
        categories: { $in: categories },
      }).limit(limit || 10);

      console.log("Products:", products);

      res.status(200).json({
        success: true,
        data: products,
        message: "Products retrieved successfully",
      });
    } catch (error: any) {
      console.error("Error retrieving products:", error);

      res.status(500).json({
        success: false,
        data: null,
        message: "Failed to retrieve products",
        error: error.message,
      });
    }
  }

  async getProductById(req: Request, res: Response): Promise<any> {
    try {
      const productId = req.params.id;
      const product = await Product.findById(productId);

      if (!product) {
        res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getProductsByIds(req: Request, res: Response): Promise<any> {
    try {
      const productIds = req.body.productIds;
      const products = await Product.find({ _id: { $in: productIds } });

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
