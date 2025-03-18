import { IScheduler, ServiceType } from "../../types/scheduler.types";

interface Context {}

interface SchedulerTaskArgs {
  id: string;
}

interface SchedulerTasksByServiceArgs {
  serviceType: ServiceType;
}

interface CreateSchedulerTaskArgs {
  input: {
    taskName: string;
    serviceType: ServiceType;
    cronExpression: string;
    enabled?: boolean;
    data?: any;
  };
}

interface UpdateSchedulerTaskArgs {
  id: string;
  input: {
    taskName?: string;
    serviceType?: ServiceType;
    cronExpression?: string;
    enabled?: boolean;
    data?: any;
  };
}

interface DeleteSchedulerTaskArgs {
  id: string;
}

interface ToggleSchedulerTaskArgs {
  id: string;
  enabled: boolean;
}

export const schedulerResolvers = {
  Query: {
    schedulerTasks: async (
      _: any,
      __: any,
      _context: Context
    ): Promise<IScheduler[]> => {
      return [];
    },

    schedulerTask: async (
      _: any,
      { id }: SchedulerTaskArgs,
      _context: Context
    ): Promise<IScheduler | null> => {
      return null;
    },

    schedulerTasksByService: async (
      _: any,
      { serviceType }: SchedulerTasksByServiceArgs,
      _context: Context
    ): Promise<IScheduler[]> => {
      return [];
    },
  },

  Mutation: {
    createSchedulerTask: async (
      _: any,
      { input }: CreateSchedulerTaskArgs,
      _context: Context
    ): Promise<IScheduler> => {
      throw new Error("Not implemented");
    },

    updateSchedulerTask: async (
      _: any,
      { id, input }: UpdateSchedulerTaskArgs,
      _context: Context
    ): Promise<IScheduler> => {
      throw new Error("Not implemented");
    },

    deleteSchedulerTask: async (
      _: any,
      { id }: DeleteSchedulerTaskArgs,
      _context: Context
    ): Promise<boolean> => {
      throw new Error("Not implemented");
    },

    toggleSchedulerTask: async (
      _: any,
      { id, enabled }: ToggleSchedulerTaskArgs,
      _context: Context
    ): Promise<IScheduler> => {
      throw new Error("Not implemented");
    },
  },
};
