import mongoose, { Document, Schema } from "mongoose";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

interface IStatusHistory {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
}

interface IOrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  userId: string;
  orderItems: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  statusHistory: IStatusHistory[];
  shippingAddress: any;
  paymentMethod: string;
  createdAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    orderItems: [
      {
        productId: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
    shippingAddress: {
      type: Schema.Types.Mixed,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });

const Order = mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
