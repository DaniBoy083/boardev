import type {
  CreateThreadInput,
  DeleteThreadInput,
  MetricsSnapshot,
} from "@/src/domain/boardev";

export type BoardevApi = {
  getLast30DaysMetrics(): Promise<MetricsSnapshot>;
  createThread(input: CreateThreadInput): Promise<void>;
  deleteThread(input: DeleteThreadInput): Promise<void>;
};