import type { CreateThreadInput, ViewerIdentity } from "@/src/domain/boardev";

export type TaskVisibility = {
  exists: boolean;
  isPublic: boolean;
};

export type ThreadAccessRecord = {
  id: string;
  parentId: string | null;
  authorEmail: string | null;
};

export type ThreadReplyRecord = {
  id: string;
  authorEmail: string | null;
};

export type BoardevServerRepository = {
  countTasksCreatedSince(since: Date): Promise<number>;
  countThreadsCreatedSince(since: Date): Promise<number>;
  getTaskVisibility(taskId: string): Promise<TaskVisibility>;
  getThread(taskId: string, threadId: string): Promise<ThreadAccessRecord | null>;
  listReplies(taskId: string, parentId: string): Promise<ThreadReplyRecord[]>;
  addThread(viewer: ViewerIdentity, input: CreateThreadInput): Promise<void>;
  deleteThreads(taskId: string, threadIds: string[]): Promise<void>;
};