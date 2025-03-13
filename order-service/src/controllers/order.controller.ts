import logger from "../config/logger";
import Order from "../models/order.model";
import { Request, Response } from "express";

export class OrderController {
  constructor() {}

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const order = req.body;

      const orderDetails = {
        userId: order.userId,
        orderItems: [
          {
            productId: order.productId,
            quantity: order.quantity,
            price: order.price,
          },
        ],
        totalAmount: order.totalAmount,
        status: order.status,
        statusHistory: [
          {
            status: order.status,
            timestamp: new Date(),
            note: order.note,
          },
        ],
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        createdAt: new Date(),
      };

      const newOrder = new Order(order);
      await newOrder.save();
      res.status(201).json({
        data: newOrder,
        error: "",
        success: true,
      });
    } catch (error: any) {
      logger.error("Error creating order", error.message);
      res.status(500).json({
        data: null,
        error: error.message,
        success: false,
      });
    }
  }

  async getOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.orderId;
      const order = await Order.findById(orderId);
      res.status(200).json({
        data: order,
        error: "",
        success: true,
      });
    } catch (error: any) {
      logger.error("Error fetching order", error.message);
      res.status(500).json({
        data: null,
        error: error.message,
        success: false,
      });
    }
  }

  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.orderId;
      const order = req.body;

      const updatedOrder = await Order.findByIdAndUpdate(orderId, order, {
        new: true,
      });

      res.status(200).json({
        data: updatedOrder,
        error: "",
        success: true,
      });
    } catch (error: any) {
      logger.error("Error updating order", error.message);
      res.status(500).json({
        data: null,
        error: error.message,
        success: false,
      });
    }
  }

  async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.orderId;
      await Order.findByIdAndDelete(orderId);
      res.status(200).json({
        data: null,
        error: "",
        success: true,
      });
    } catch (error: any) {
      logger.error("Error deleting order", error.message);
      res.status(500).json({
        data: null,
        error: error.message,
        success: false,
      });
    }
  }
}
