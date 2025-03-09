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
}
