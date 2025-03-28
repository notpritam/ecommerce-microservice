import { OrderServiceClient } from "../clients/order.client";
import logger from "../config/logger";
import { generateTokens } from "../middleware/auth";
import { NotFoundError } from "../middleware/errorHandler";
import { IAuthResponse } from "../types";
import { IOrder } from "../types/orders.types";
import { IUser } from "../types/user.types";

class OrderService {
  private orderClient: OrderServiceClient;

  constructor() {
    this.orderClient = new OrderServiceClient();
  }

  async getOrderById(orderId: string): Promise<IOrder> {
    try {
      logger.info("Get order by ID:", orderId);

      const response = await this.orderClient.getOrderById(orderId);

      if (!response.success) {
        throw new NotFoundError("Order not found");
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateOrder(orderId: string, order: IOrder): Promise<IOrder> {
    try {
      logger.info("Update order:", orderId);

      const response = await this.orderClient.updateOrder(orderId, order);

      if (!response.success) {
        throw new Error("Failed to update order");
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
    note?: string
  ): Promise<IOrder> {
    try {
      logger.info("Update order status:", orderId);

      const response = await this.orderClient.updateOrderStatus(
        orderId,
        status,
        note
      );

      if (!response.success) {
        throw new Error("Failed to update order status");
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getUserById(userId: string): Promise<IUser> {
    try {
      logger.info("Get user by ID:", userId);

      const user = await this.orderClient.getUserById(userId);

      if (!user) {
        throw new NotFoundError("User not found");
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers(): Promise<IUser[]> {
    try {
      const users = await this.orderClient.getAllUsers();

      if (!users) {
        throw new NotFoundError("No users found");
      }

      return users;
    } catch (error) {
      throw error;
    }
  }

  async createUser(user: IUser): Promise<IAuthResponse> {
    try {
      logger.info("Create user:", user);

      const newUser = await this.orderClient.createUser(user);

      if (!newUser) {
        throw new Error("Failed to create user");
      }

      const token = await generateTokens(user);

      return { user: newUser, ...token };
    } catch (error) {
      throw error;
    }
  }

  async login(email: string, password: string): Promise<IAuthResponse> {
    try {
      logger.info("Login user:", email);

      const user = await this.orderClient.loginUser(email, password);

      if (!user) {
        throw new Error("User not found");
      }

      const token = await generateTokens(user);

      return { user, ...token };
    } catch (error) {
      throw error;
    }
  }

  async updateUser(userId: string, user: IUser): Promise<IUser> {
    try {
      logger.info("Update user:", userId);

      user._id = userId;

      const updatedUser = await this.orderClient.updateUser(user);

      if (!updatedUser) {
        throw new Error("Failed to update user");
      }

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }
}

const orderService = new OrderService();

export default orderService;
