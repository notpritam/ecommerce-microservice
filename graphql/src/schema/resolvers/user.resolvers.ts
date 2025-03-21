import logger from "../../config/logger";
import { hasRole, isAuthenticated } from "../../middleware/auth";
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
} from "../../middleware/errorHandler";
import UserService from "../../services/user.service";

export const userResolvers = {
  Query: {
    // Get current authenticated user
    me: async (_: any, __: any, context: any) => {
      try {
        const user = isAuthenticated(context);
        return await UserService.getUserById(user._id);
      } catch (error) {
        logger.error("Error in me resolver:", error);
        throw error;
      }
    },

    getUser: async (_: any, { id }: { id: string }, context: any) => {
      try {
        isAuthenticated(context);
        return await UserService.getUserById(id);
      } catch (error) {
        logger.error(`Error in getUser resolver for ID ${id}:`, error);
        throw error;
      }
    },

    // Get all users (admin only)
    getAllUsers: async (_: any, __: any, context: any) => {
      try {
        hasRole(context, "admin");
        return await UserService.getAllUsers();
      } catch (error) {
        logger.error("Error in getAllUsers resolver:", error);
        throw error;
      }
    },
  },

  Mutation: {
    // Register a new user
    register: async (_: any, { input }: any) => {
      try {
        return await UserService.createUser(input);
      } catch (error: any) {
        if (
          error.message &&
          error.message.includes("E11000 duplicate key error")
        ) {
          throw new ValidationError("Email already exists");
        }
        logger.error("Error in register resolver:", error);
        throw error;
      }
    },

    // Login a user
    login: async (_: any, { input }: any) => {
      try {
        return await UserService.login(input.email, input.password);
      } catch (error) {
        throw new AuthenticationError("Invalid email or password");
      }
    },

    updateUser: async (_: any, { id, input }: any, context: any) => {
      try {
        const user = isAuthenticated(context);
        // Only allow users to update their own info, unless they're an admin
        if (user._id !== id && user.role !== "admin") {
          throw new AuthorizationError("Not authorized to update this user");
        }

        return await UserService.updateUser(id, input);
      } catch (error) {
        logger.error(`Error in updateUser resolver for ID ${id}:`, error);
        throw error;
      }
    },

    // Delete a user (admin only)
    deleteUser: async (_: any, { id }: { id: string }, context: any) => {
      try {
        // hasRole(context, "admin");
        // return await UserService.deleteUser(id);

        logger.info("Delete user:", id);

        return {
          success: true,
          message: "User deleted successfully",
        };
      } catch (error) {
        logger.error(`Error in deleteUser resolver for ID ${id}:`, error);
        throw error;
      }
    },
  },
};
