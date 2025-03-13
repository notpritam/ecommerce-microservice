import { producer } from "../config/kafka";
import Order, { OrderStatus } from "../models/order.model";

class OrderService {
  constructor() {}

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      const order = await Order.findById(orderId);

      if (!order) {
        throw new Error("Order not found");
      }
      const oldStatus = order.status;
      order.status = status;
      await order.save();

      await producer.send({
        topic: "order.status",
        messages: [
          {
            key: orderId,
            value: JSON.stringify({
              orderId,
              taskName: "process-order-status-updates",
              userId: order.userId,
              oldStatus,
              newStatus: status,
              updatedAt: new Date(),
            }),
          },
        ],
      });
    } catch (error) {}
  }
}

const orderService = new OrderService();

export default orderService;
