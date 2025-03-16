import { BaseServiceClient } from "./base.client";
import ENV from "../config/env";
import { IUser } from "../types/user.types";
import logger from "../config/logger";
import { IOrder } from "../types/orders.types";
import { IApiResponse } from "../types";

export class OrderServiceClient extends BaseServiceClient {
  constructor() {
    const orderServiceUrl = ENV.services.orderServiceURL;
    super(orderServiceUrl, "Order");
  }

  async getOrderById(orderId: string): Promise<IApiResponse<IOrder>> {
    try {
      return this.get<IApiResponse<IOrder>>(`/${orderId}`);
    } catch (error) {
      logger.error(`Error in getOrderById for ID ${orderId}:`, error);
      throw error;
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
    note?: string
  ): Promise<IApiResponse<IOrder>> {
    try {
      return this.put<IApiResponse<IOrder>>(`/${orderId}/status`, {
        status,
        note,
      });
    } catch (error) {
      logger.error(`Error in updateOrderStatus for ID ${orderId}:`, error);
      throw error;
    }
  }

  async updateOrder(
    orderId: string,
    order: IOrder
  ): Promise<IApiResponse<IOrder>> {
    try {
      return this.put<IApiResponse<IOrder>>(`/${orderId}`, order);
    } catch (error) {
      logger.error(`Error in updateOrder for ID ${orderId}:`, error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<IUser> {
    try {
      return this.get<IUser>(`/api/users/${userId}`);
    } catch (error) {
      logger.error(`Error in getUserById for ID ${userId}:`, error);
      throw error;
    }
  }

  async getAllUsers(): Promise<IUser[]> {
    try {
      return this.get<IUser[]>("/api/users");
    } catch (error) {
      logger.error("Error in getAllUsers:", error);
      throw error;
    }
  }

  async createUser(user: IUser): Promise<IUser> {
    try {
      return this.post<IUser>("/api/users", user);
    } catch (error) {
      logger.error("Error in createUser:", error);
      throw error;
    }
  }

  async loginUser(email: string, password: string): Promise<IUser> {
    try {
      return this.post<IUser>("/api/users/login", {
        email,
        password,
      });
    } catch (error) {
      logger.error("Error in loginUser:", error);
      throw error;
    }
  }

  async updateUser(user: IUser): Promise<IUser> {
    try {
      return this.put<IUser>(`/api/users/${user._id}`, user);
    } catch (error) {
      throw error;
    }
  }
}
