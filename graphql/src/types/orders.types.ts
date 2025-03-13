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

export interface IOrder {
  id: string;
  userId: string;
  orderItems: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  statusHistory: IStatusHistory[];
  shippingAddress: any;
  paymentMethod: string;
  createdAt: Date;
}
