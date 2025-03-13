import { IOrder, OrderStatus } from "../../types/orders.types";

interface OrderItemInput {
  productId: string;
  quantity: number;
  price: number;
}

interface StatusHistoryInput {
  status: OrderStatus;
  timestamp?: Date;
  note?: string;
}

interface ShippingAddressInput {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CreateOrderInput {
  userId: string;
  orderItems: OrderItemInput[];
  totalAmount: number;
  status?: OrderStatus;
  statusHistory?: StatusHistoryInput[];
  shippingAddress: ShippingAddressInput;
  paymentMethod: string;
}

export const orderResolvers = {
  Query: {
    getOrder: async (
      _: any,
      { id }: { id: string }
    ): Promise<IOrder | null> => {
      return {
        id: "1",
        userId: "1",
        orderItems: [
          {
            productId: "1",
            quantity: 1,
            price: 100,
          },
        ],
        totalAmount: 100,
        status: "pending",
        statusHistory: [
          {
            status: "pending",
            timestamp: new Date(),
            note: "Order created",
          },
        ],
        shippingAddress: {
          street: "123 Main St",
          city: "Springfield",
          state: "IL",
          zipCode: "62701",
          country: "USA",
        },
        paymentMethod: "credit card",
        createdAt: new Date(),
      };
    },
    getOrdersByUser: async (
      _: any,
      { userId }: { userId: string }
    ): Promise<IOrder[]> => {
      return [];
    },
    getOrdersByStatus: async (
      _: any,
      { status }: { status: OrderStatus }
    ): Promise<IOrder[]> => {
      return [];
    },
    getAllOrders: async (
      _: any,
      { limit = 10, offset = 0 }: { limit?: number; offset?: number }
    ): Promise<IOrder[]> => {
      return [];
    },
  },

  Mutation: {
    createOrder: async (
      _: any,
      { input }: { input: CreateOrderInput }
    ): Promise<IOrder> => {
      const {
        userId,
        orderItems,
        totalAmount,
        status = "pending" as OrderStatus,
        shippingAddress,
        paymentMethod,
      } = input;

      return {
        id: "1",
        userId: "1",
        orderItems: [
          {
            productId: "1",
            quantity: 1,
            price: 100,
          },
        ],
        totalAmount: 100,
        status: "pending",
        statusHistory: [
          {
            status: "pending",
            timestamp: new Date(),
            note: "Order created",
          },
        ],
        shippingAddress: {
          street: "123 Main St",
          city: "Springfield",
          state: "IL",
          zipCode: "62701",
          country: "USA",
        },
        paymentMethod: "credit card",
        createdAt: new Date(),
      };
    },

    updateOrderStatus: async (
      _: any,
      { id, status, note }: { id: string; status: OrderStatus; note?: string }
    ): Promise<IOrder | null> => {
      //   const order = await Order.findById(id);

      //   if (!order) {
      //     throw new Error(`Order with id ${id} not found`);
      //   }

      // Add new status to history
      const statusUpdate = {
        status,
        timestamp: new Date(),
        note: note || `Status updated to ${status}`,
      };

      // Update the order
      return {
        id: "1",
        userId: "1",
        orderItems: [
          {
            productId: "1",
            quantity: 1,
            price: 100,
          },
        ],
        totalAmount: 100,
        status: "pending",
        statusHistory: [
          {
            status: "pending",
            timestamp: new Date(),
            note: "Order created",
          },
        ],
        shippingAddress: {
          street: "123 Main St",
          city: "Springfield",
          state: "IL",
          zipCode: "62701",
          country: "USA",
        },
        paymentMethod: "credit card",
        createdAt: new Date(),
      };
    },

    cancelOrder: async (
      _: any,
      { id, note }: { id: string; note?: string }
    ): Promise<IOrder | null> => {
      const order = {
        id: "1",
        userId: "1",
        orderItems: [
          {
            productId: "1",
            quantity: 1,
            price: 100,
          },
        ],
        totalAmount: 100,
        status: "pending",
        statusHistory: [
          {
            status: "pending",
            timestamp: new Date(),
            note: "Order created",
          },
        ],
        shippingAddress: {
          street: "123 Main St",
          city: "Springfield",
          state: "IL",
          zipCode: "62701",
          country: "USA",
        },
        paymentMethod: "credit card",
        createdAt: new Date(),
      };

      if (!order) {
        throw new Error(`Order with id ${id} not found`);
      }

      // Cannot cancel if already delivered
      if (order.status === "delivered") {
        throw new Error("Cannot cancel an order that has been delivered");
      }

      // Add cancellation to status history
      const statusUpdate = {
        status: "cancelled" as OrderStatus,
        timestamp: new Date(),
        note: note || "Order cancelled",
      };

      // Update the order
      return {
        id: "1",
        userId: "1",
        orderItems: [
          {
            productId: "1",
            quantity: 1,
            price: 100,
          },
        ],
        totalAmount: 100,
        status: "pending",
        statusHistory: [
          {
            status: "pending",
            timestamp: new Date(),
            note: "Order created",
          },
        ],
        shippingAddress: {
          street: "123 Main St",
          city: "Springfield",
          state: "IL",
          zipCode: "62701",
          country: "USA",
        },
        paymentMethod: "credit card",
        createdAt: new Date(),
      };
    },
  },
};
