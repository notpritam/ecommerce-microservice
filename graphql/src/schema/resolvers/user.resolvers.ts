import logger from "../../config/logger";

export const userResolvers = {
  Query: {
    // Get current authenticated user
    me: async (_: any, __: any, context: any) => {
      try {
        // For now, just return the user from the context
        logger.info("Me resolver context:", context);

        return context.user;
        // const user = isAuthenticated(context);
        // return await UserService.getUserById(user.id);
      } catch (error) {
        logger.error("Error in me resolver:", error);
        throw error;
      }
    },

    // Get user by ID (requires authentication)
    getUser: async (_: any, { id }: { id: string }, context: any) => {
      try {
        // isAuthenticated(context);
        // return await UserService.getUserById(id);

        logger.info("Get user by ID:", id);

        return {
          id,
          name: "Test User",
          email: "test@gmail.com",
        };
      } catch (error) {
        logger.error(`Error in getUser resolver for ID ${id}:`, error);
        throw error;
      }
    },

    // Get all users (admin only)
    getAllUsers: async (_: any, __: any, context: any) => {
      try {
        // hasRole(context, "admin");
        // return await UserService.getAllUsers();

        logger.info("Get all users");
        return [
          {
            id: "1",
            name: "Test User",
            email: "test@gmail.com",
          },
        ];
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
        // return await UserService.register(input);
        logger.info("Register user:", input);

        return {
          success: true,
          message: "User registered successfully",
          token: "",
        };
      } catch (error) {
        logger.error("Error in register resolver:", error);
        throw error;
      }
    },

    // Login a user
    login: async (_: any, { input }: any) => {
      try {
        // return await UserService.login(input);
        logger.info("Login user:", input);

        return {
          success: true,
          message: "User logged in successfully",
          token: "",
        };
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

  // Resolvers for User type fields if needed
  Types: {
    // Example: If we need to fetch additional data for User type
    User: {
      // This is just an example of how to add field resolvers if needed
      // e.g., if we wanted to fetch notifications count for a user
      /*
      notificationsCount: async (parent: any) => {
        try {
          const stats = await NotificationService.getNotificationStats(parent.id);
          return stats.totalCount;
        } catch (error) {
          logger.error(`Error resolving notificationsCount for user ${parent.id}:`, error);
          return 0;
        }
      },
      */
    },
  },
};
