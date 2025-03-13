import { Request, Response } from "express";
import Product from "../models/product.model";
export class ProductController {
  constructor() {}

  async getProducts(req: Request, res: Response) {
    try {
      const products = await Product.find();

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
