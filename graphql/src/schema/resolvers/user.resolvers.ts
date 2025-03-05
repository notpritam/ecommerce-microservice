import logger from "../../config/logger";
import { isAuthenticated } from "../../middleware/auth";
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
        // isAuthenticated(context);
        return await UserService.getUserById(id);
      } catch (error) {
        logger.error(`Error in getUser resolver for ID ${id}:`, error);
        throw error;
      }
    },

    // Get all users (admin only)
    getAllUsers: async (_: any, __: any, context: any) => {
      try {
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
      } catch (error) {
        logger.error("Error in register resolver:", error);
        throw error;
      }
    },

    // Login a user
    login: async (_: any, { input }: any) => {
      try {
        return await UserService.login(input.email, input.password);
      } catch (error) {
        logger.error("Error in login resolver:", error);
        throw error;
      }
    },

    // Update a user (requires authentication)
    updateUser: async (_: any, { id, input }: any, context: any) => {
      try {
        // const user = isAuthenticated(context);
        // Only allow users to update their own info, unless they're an admin
        // if (user.id !== id && user.role !== "admin") {
        //   throw new Error("Not authorized to update this user");
        // }
        // return await UserService.updateUser(id, input);

        logger.info("Update user:", id, input);

        return {
          id,
          name: "Test User",
          email: "",
        };
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
