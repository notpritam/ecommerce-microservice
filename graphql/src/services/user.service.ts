import { UserServiceClient } from "../clients/user.client";
import logger from "../config/logger";
import { IUser } from "../types/user.types";

export class UserService {
  private userClient: UserServiceClient;
  constructor() {
    this.userClient = new UserServiceClient();
  }

  async getUserById(userId: string): Promise<any> {
    try {
      logger.info("Get user by ID:", userId);

      const user = await this.userClient.getUserById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers(): Promise<IUser[]> {
    try {
      const users = await this.userClient.getAllUsers();

      if (!users) {
        throw new Error("No users found");
      }

      return users;
    } catch (error) {
      throw error;
    }
  }
}
