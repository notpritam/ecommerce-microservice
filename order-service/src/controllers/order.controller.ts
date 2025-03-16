import { producer } from "../config/kafka";
import logger from "../config/logger";
import Order from "../models/order.model";
import { Request, Response } from "express";

class OrderController {
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
      const orderId = req.params.id;
      console.log("orderId", orderId);
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

      if (!orderId) {
        res.status(400).json({
          data: null,
          error: "Order ID is required",
          success: false,
        });
        return;
      }

      const updatedOrder = await Order.findByIdAndUpdate(orderId, order, {
        new: true,
      });

      if (!updatedOrder) {
        res.status(404).json({
          data: null,
          error: "Order not found",
          success: false,
        });
        return;
      }

      producer.send({
        topic: "order.events",
        messages: [
          {
            value: JSON.stringify({
              orderId: updatedOrder._id,
              userId: updatedOrder.userId,
              status: updatedOrder.status,
              taskName: "process-order-status-updates",
              updatedAt: new Date(),
            }),
          },
        ],
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

  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.id;
      const { status, note } = req.body;

      logger.info("Updating order status", orderId, status, note);

      if (!orderId) {
        res.status(400).json({
          data: null,
          error: "Order ID is required",
          success: false,
        });
        return;
      }

      const order = await Order.findById(orderId);

      if (!order) {
        res.status(404).json({
          data: null,
          error: "Order not found",
          success: false,
        });
        return;
      }

      order.status = status;
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        note,
      });

      const updatedOrder = await order.save();

      producer.send({
        topic: "order.events",
        messages: [
          {
            value: JSON.stringify({
              taskName: "process-order-status-updates",
              data: {
                updatedAt: new Date(),
                orderId: updatedOrder._id,
                userId: updatedOrder.userId,
                oldStatus: order.status,
                newStatus: status,
              },
            }),
          },
        ],
      });

      res.status(200).json({
        data: updatedOrder,
        error: "",
        success: true,
      });
    } catch (error: any) {
      logger.error("Error updating order status", error.message);
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

const orderController = new OrderController();

export default orderController;
