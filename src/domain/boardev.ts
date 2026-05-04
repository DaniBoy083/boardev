export const TASK_TEXT_MAX_LENGTH = 500;
export const THREAD_MESSAGE_MAX_LENGTH = 2000;
export const RECENT_METRICS_WINDOW_DAYS = 30;

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export type TaskRecord = {
  id: string;
  task: string;
  user: string | null;
  email: string | null;
  isPublic: boolean;
  createdAt: Date | null;
};

export type ThreadRecord = {
  id: string;
  message: string;
  authorName: string;
  authorEmail: string | null;
  parentId: string | null;
  createdAt: Date | null;
};

export type ThreadMetrics = {
  threads: number;
  comments: number;
  replies: number;
};

export type MetricsSnapshot = {
  tasksLast30Days: number;
  commentsLast30Days: number;
};

export type CreateTaskInput = {
  task: string;
  user: string;
  email: string;
  isPublic: boolean;
};

export type CreateThreadInput = {
  taskId: string;
  message: string;
  parentId: string | null;
};

export type DeleteThreadInput = {
  taskId: string;
  commentId: string;
};

export type ViewerIdentity = {
  email: string;
  name: string;
};

function getCreatedAtTime(createdAt: Date | null): number {
  return createdAt?.getTime() ?? 0;
}

export function compareByCreatedAtDesc<T extends { createdAt: Date | null }>(
  left: T,
  right: T,
): number {
  return getCreatedAtTime(right.createdAt) - getCreatedAtTime(left.createdAt);
}

export function isRootThread(comment: Pick<ThreadRecord, "parentId">): boolean {
  return !comment.parentId;
}

export function calculateThreadMetrics(
  comments: Array<Pick<ThreadRecord, "parentId">>,
): ThreadMetrics {
  const threads = comments.filter(isRootThread).length;
  const totalComments = comments.length;

  return {
    threads,
    comments: totalComments,
    replies: totalComments - threads,
  };
}

export function groupRepliesByParent(comments: ThreadRecord[]): Map<string, ThreadRecord[]> {
  const repliesByParent = new Map<string, ThreadRecord[]>();

  for (const comment of comments) {
    if (!comment.parentId) {
      continue;
    }

    const replies = repliesByParent.get(comment.parentId) ?? [];
    replies.push(comment);
    repliesByParent.set(comment.parentId, replies);
  }

  return repliesByParent;
}

export function getWindowStart(days: number, now = new Date()): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}