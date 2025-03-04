import { BaseServiceClient } from "./base.client";
import ENV from "../config/env";
import { IUser } from "../types/user.types";
import logger from "../config/logger";

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
}
