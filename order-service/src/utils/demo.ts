import { Types } from "mongoose";
import axios from "axios";
import Order, { IOrder, OrderStatus } from "../models/order.model";

interface User {
  id: string;
}

interface Product {
  id: string;
  price: number;
}

async function fetchUsers(apiUrl: string): Promise<User[]> {
  try {
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

async function fetchProducts(apiUrl: string): Promise<Product[]> {
  try {
    const response = await axios.get(apiUrl);
    // logger.info("Products retrieved successfully", response.data);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

export async function generateDemoOrders(
  usersApiUrl: string,
  productsApiUrl: string,
  ordersPerUser: number = 5,
  minOrderItems: number = 1,
  maxOrderItems: number = 5
): Promise<IOrder[]> {
  // Fetch users and products from APIs
  const users = await fetchUsers(usersApiUrl);
  const products = await fetchProducts(productsApiUrl);

  if (!users.length) {
    throw new Error("No users found from API");
  }

  if (!products.length) {
    throw new Error("No products found from API");
  }

  console.log(`Fetched ${users.length} users and ${products.length} products`);

  const orders: IOrder[] = [];

  // Sample payment methods
  const paymentMethods = ["credit_card", "paypal", "bank_transfer", "crypto"];

  // Sample addresses
  const addresses = [
    {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
    },
    {
      street: "456 Oak Ave",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      country: "USA",
    },
    {
      street: "789 Pine Blvd",
      city: "Chicago",
      state: "IL",
      zipCode: "60007",
      country: "USA",
    },
    {
      street: "321 Maple Dr",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
      country: "USA",
    },
  ];

  // Sample order statuses with reasonable distribution
  const statuses: OrderStatus[] = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const statusWeights = [0.1, 0.2, 0.2, 0.4, 0.1]; // 10% pending, 20% processing, etc.

  // Generate orders for each user
  for (const user of users) {
    for (let i = 0; i < ordersPerUser; i++) {
      // Generate random date within the last 90 days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 90));

      // Select random number of order items
      const numItems =
        Math.floor(Math.random() * (maxOrderItems - minOrderItems + 1)) +
        minOrderItems;

      // Generate order items with real products
      const orderItems = [];
      let totalAmount = 0;

      // Create a set of product indices to avoid duplicates in the same order
      const selectedProductIndices = new Set<number>();

      while (
        selectedProductIndices.size < numItems &&
        selectedProductIndices.size < products.length
      ) {
        const randomIndex = Math.floor(Math.random() * products.length);

        if (!selectedProductIndices.has(randomIndex)) {
          selectedProductIndices.add(randomIndex);
          const product = products[randomIndex];
          const quantity = Math.floor(Math.random() * 5) + 1;
          const price = product?.price;

          orderItems.push({
            productId: product?.id,
            quantity,
            price,
          });

          totalAmount += (price || 0) * quantity;
        }
      }

      totalAmount = Math.round(totalAmount * 100) / 100;

      const statusRandom = Math.random();
      let cumulativeWeight = 0;
      let selectedStatus: OrderStatus = "pending";

      for (let k = 0; k < statuses.length; k++) {
        cumulativeWeight += statusWeights[k] || 0;
        if (statusRandom <= cumulativeWeight) {
          selectedStatus = statuses[k] as OrderStatus;
          break;
        }
      }

      // Generate status history
      const statusHistory = generateStatusHistory(selectedStatus, createdAt);

      // Create the order object
      const orderData = {
        userId: user.id,
        orderItems,
        totalAmount,
        status: selectedStatus,
        statusHistory,
        shippingAddress:
          addresses[Math.floor(Math.random() * addresses.length)],
        paymentMethod:
          paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        createdAt,
      };

      const order = await Order.create(orderData);
      orders.push(order);
    }
  }

  return orders;
}

function generateStatusHistory(
  finalStatus: OrderStatus,
  createdAt: Date
): Array<{ status: OrderStatus; timestamp: Date; note?: string }> {
  const history: Array<{
    status: OrderStatus;
    timestamp: Date;
    note?: string;
  }> = [];
  const statusSequence: OrderStatus[] = [
    "pending",
    "processing",
    "shipped",
    "delivered",
  ];

  const pendingDate = new Date(createdAt);
  history.push({
    status: "pending",
    timestamp: pendingDate,
    note: "Order placed",
  });

  if (finalStatus === "pending") {
    return history;
  }

  if (finalStatus === "cancelled") {
    const cancelIndex = Math.floor(Math.random() * 2);

    if (cancelIndex >= 1) {
      const processingDate = new Date(pendingDate);
      processingDate.setHours(
        processingDate.getHours() + Math.floor(Math.random() * 24) + 1
      );

      history.push({
        status: "processing",
        timestamp: processingDate,
        note: "Order processing started",
      });
    }

    const cancelDate = new Date(
      (history[history?.length - 1] as any).timestamp
    );
    cancelDate.setHours(
      cancelDate.getHours() + Math.floor(Math.random() * 48) + 1
    );

    history.push({
      status: "cancelled",
      timestamp: cancelDate,
      note:
        Math.random() > 0.5
          ? "Cancelled by customer"
          : "Cancelled due to payment issue",
    });

    return history;
  }

  const finalStatusIndex = statusSequence.indexOf(finalStatus);

  for (let i = 1; i <= finalStatusIndex; i++) {
    const prevDate: any = history[i - 1]?.timestamp;
    const nextDate = new Date(prevDate);

    // Add random hours based on status
    let hoursToAdd = 0;
    let note = "";

    switch (statusSequence[i]) {
      case "processing":
        hoursToAdd = Math.floor(Math.random() * 24) + 1; // 1-24 hours
        note = "Order processing started";
        break;
      case "shipped":
        hoursToAdd = Math.floor(Math.random() * 48) + 24; // 24-72 hours
        note =
          "Order shipped via " +
          ["UPS", "FedEx", "USPS", "DHL"][Math.floor(Math.random() * 4)];
        break;
      case "delivered":
        hoursToAdd = Math.floor(Math.random() * 72) + 48; // 48-120 hours
        note = "Order delivered successfully";
        break;
    }

    nextDate.setHours(nextDate.getHours() + hoursToAdd);

    history.push({
      status: statusSequence[i] as OrderStatus,
      timestamp: nextDate,
      note,
    });
  }

  return history;
}

export async function createDemoOrders(
  usersApiUrl: string,
  productsApiUrl: string,
  ordersPerUser: number = 5
): Promise<void> {
  try {
    console.log("Starting to generate orders...");
    const orders = await generateDemoOrders(
      usersApiUrl,
      productsApiUrl,
      ordersPerUser
    );
    console.log(`Successfully generated ${orders.length} orders!`);
  } catch (error) {
    console.error("Error generating demo orders:", error);
    throw error;
  }
}
