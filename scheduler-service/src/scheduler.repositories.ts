import SchedulerModel, { IScheduler } from "./models/scheduler.model";

export const findAllSchedulers = async (): Promise<IScheduler[]> => {
  return SchedulerModel.find({ enabled: true });
};

export const findDueSchedulers = async (): Promise<IScheduler[]> => {
  const now = new Date();
  return SchedulerModel.find({
    enabled: true,
    $or: [{ nextRun: { $lte: now } }, { nextRun: { $exists: false } }],
  });
};

export const updateSchedulerRuntime = async (
  id: string,
  lastRun: Date,
  nextRun: Date
): Promise<IScheduler | null> => {
  return SchedulerModel.findByIdAndUpdate(
    id,
    { $set: { lastRun, nextRun } },
    { new: true }
  );
};

export const createScheduler = async (
  schedulerData: Partial<IScheduler>
): Promise<IScheduler> => {
  const scheduler = new SchedulerModel(schedulerData);
  return scheduler.save();
};

export const updateScheduler = async (
  id: string,
  data: Partial<IScheduler>
): Promise<IScheduler | null> => {
  return SchedulerModel.findByIdAndUpdate(id, { $set: data }, { new: true });
};

export const deleteScheduler = async (
  id: string
): Promise<IScheduler | null> => {
  return SchedulerModel.findByIdAndDelete(id);
};
