import type { BoardevApi } from "@/src/application/ports/boardev-api";
import type { BoardevClientRepository } from "@/src/application/ports/boardev-client-repository";
import type { BoardevServerRepository } from "@/src/application/ports/boardev-server-repository";
import {
  AppError,
  RECENT_METRICS_WINDOW_DAYS,
  calculateThreadMetrics,
  compareByCreatedAtDesc,
  getWindowStart,
  type CreateTaskInput,
  type CreateThreadInput,
  type DeleteThreadInput,
  type MetricsSnapshot,
  type TaskRecord,
  type ThreadMetrics,
  type ThreadRecord,
  type ViewerIdentity,
} from "@/src/domain/boardev";
import {
  validateIdentifier,
  validateTaskInput,
  validateThreadMessage,
} from "@/src/application/validation/boardev";

export async function createTaskUseCase(
  repository: BoardevClientRepository,
  input: CreateTaskInput,
): Promise<void> {
  await repository.createTask(validateTaskInput(input));
}

export async function deleteTaskUseCase(
  repository: BoardevClientRepository,
  taskId: string,
): Promise<void> {
  await repository.deleteTask(validateIdentifier(taskId, "Task invalida."));
}

export async function getSharedTaskUseCase(
  repository: BoardevClientRepository,
  taskId: string,
): Promise<TaskRecord> {
  const normalizedTaskId = validateIdentifier(taskId, "Link invalido.");
  const task = await repository.getTaskById(normalizedTaskId);

  if (!task) {
    throw new AppError(404, "Tarefa nao encontrada.");
  }

  if (!task.isPublic) {
    throw new AppError(403, "Esta tarefa e privada e nao pode ser compartilhada.");
  }

  return task;
}

export function observeUserTasksUseCase(
  repository: BoardevClientRepository,
  userEmail: string,
  onTasks: (tasks: TaskRecord[]) => void,
  onError: (error: Error) => void,
): () => void {
  const normalizedEmail = userEmail.trim();

  if (!normalizedEmail) {
    onTasks([]);
    return () => undefined;
  }

  return repository.observeUserTasks(
    normalizedEmail,
    (tasks) => onTasks([...tasks].sort(compareByCreatedAtDesc)),
    onError,
  );
}

export function observeTaskThreadsUseCase(
  repository: BoardevClientRepository,
  taskId: string,
  onThreads: (threads: ThreadRecord[]) => void,
  onError: (error: Error) => void,
): () => void {
  const normalizedTaskId = taskId.trim();

  if (!normalizedTaskId) {
    onThreads([]);
    return () => undefined;
  }

  return repository.observeTaskThreads(normalizedTaskId, onThreads, onError);
}

export function observeTaskThreadMetricsUseCase(
  repository: BoardevClientRepository,
  taskId: string,
  onMetrics: (metrics: ThreadMetrics) => void,
  onError: (error: Error) => void,
): () => void {
  return observeTaskThreadsUseCase(
    repository,
    taskId,
    (threads) => onMetrics(calculateThreadMetrics(threads)),
    onError,
  );
}

export async function getLast30DaysMetricsUseCase(
  repository: BoardevServerRepository,
): Promise<MetricsSnapshot> {
  const since = getWindowStart(RECENT_METRICS_WINDOW_DAYS);

  const [tasksLast30Days, commentsLast30Days] = await Promise.all([
    repository.countTasksCreatedSince(since),
    repository.countThreadsCreatedSince(since),
  ]);

  return {
    tasksLast30Days,
    commentsLast30Days,
  };
}

export async function createThreadUseCase(
  repository: BoardevServerRepository,
  viewer: ViewerIdentity,
  input: CreateThreadInput,
): Promise<void> {
  const taskId = validateIdentifier(input.taskId, "Dados invalidos.");
  const message = validateThreadMessage(input.message);
  const parentId = input.parentId?.trim() || null;
  const taskVisibility = await repository.getTaskVisibility(taskId);

  if (!taskVisibility.exists) {
    throw new AppError(404, "Tarefa nao encontrada.");
  }

  if (!taskVisibility.isPublic) {
    throw new AppError(403, "Tarefa privada.");
  }

  if (parentId) {
    const parentComment = await repository.getThread(taskId, parentId);

    if (!parentComment) {
      throw new AppError(404, "Comentario pai nao encontrado.");
    }

    if (parentComment.parentId) {
      throw new AppError(400, "Apenas um nivel de resposta e permitido.");
    }
  }

  await repository.addThread(viewer, {
    taskId,
    message,
    parentId,
  });
}

export async function deleteThreadUseCase(
  repository: BoardevServerRepository,
  viewer: ViewerIdentity,
  input: DeleteThreadInput,
): Promise<void> {
  const taskId = validateIdentifier(input.taskId, "Dados invalidos.");
  const commentId = validateIdentifier(input.commentId, "Dados invalidos.");
  const targetComment = await repository.getThread(taskId, commentId);

  if (!targetComment) {
    throw new AppError(404, "Comentario nao encontrado.");
  }

  if (targetComment.authorEmail !== viewer.email) {
    throw new AppError(403, "Voce so pode excluir seus proprios comentarios.");
  }

  const threadIdsToDelete = [commentId];

  if (!targetComment.parentId) {
    const replies = await repository.listReplies(taskId, commentId);
    const hasForeignReplies = replies.some((reply) => reply.authorEmail !== viewer.email);

    if (hasForeignReplies) {
      throw new AppError(
        403,
        "Nao e possivel excluir a thread com respostas de outros usuarios.",
      );
    }

    threadIdsToDelete.push(...replies.map((reply) => reply.id));
  }

  await repository.deleteThreads(taskId, threadIdsToDelete);
}

export async function loadLast30DaysMetricsUseCase(api: BoardevApi): Promise<MetricsSnapshot> {
  return api.getLast30DaysMetrics();
}

export async function createThreadFromApiUseCase(
  api: BoardevApi,
  input: CreateThreadInput,
): Promise<void> {
  await api.createThread({
    taskId: validateIdentifier(input.taskId, "Dados invalidos."),
    message: validateThreadMessage(input.message),
    parentId: input.parentId?.trim() || null,
  });
}

export async function deleteThreadFromApiUseCase(
  api: BoardevApi,
  input: DeleteThreadInput,
): Promise<void> {
  await api.deleteThread({
    taskId: validateIdentifier(input.taskId, "Dados invalidos."),
    commentId: validateIdentifier(input.commentId, "Dados invalidos."),
  });
}