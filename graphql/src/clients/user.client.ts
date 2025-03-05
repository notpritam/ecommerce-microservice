import { BaseServiceClient } from "./base.client";
import ENV from "../config/env";
import { IUser } from "../types/user.types";
import logger from "../config/logger";
import { IAuthResponse } from "../types";

export class UserServiceClient extends BaseServiceClient {
  constructor() {
    const userServiceUrl = ENV.services.userServiceURL;
    super(userServiceUrl, "User");
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
}
