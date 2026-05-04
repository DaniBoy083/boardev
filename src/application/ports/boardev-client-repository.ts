import type {
  CreateTaskInput,
  TaskRecord,
  ThreadRecord,
} from "@/src/domain/boardev";

export type BoardevClientRepository = {
  createTask(input: CreateTaskInput): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
  getTaskById(taskId: string): Promise<TaskRecord | null>;
  observeUserTasks(
    userEmail: string,
    onTasks: (tasks: TaskRecord[]) => void,
    onError: (error: Error) => void,
  ): () => void;
  observeTaskThreads(
    taskId: string,
    onThreads: (threads: ThreadRecord[]) => void,
    onError: (error: Error) => void,
  ): () => void;
};