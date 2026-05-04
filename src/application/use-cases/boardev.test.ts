import { describe, expect, it, vi } from "vitest";
import type { BoardevClientRepository } from "@/src/application/ports/boardev-client-repository";
import type { BoardevServerRepository } from "@/src/application/ports/boardev-server-repository";
import {
  createThreadUseCase,
  deleteThreadUseCase,
  getLast30DaysMetricsUseCase,
  getSharedTaskUseCase,
} from "@/src/application/use-cases/boardev";
import type { ViewerIdentity } from "@/src/domain/boardev";

const viewer: ViewerIdentity = {
  email: "daniel@example.com",
  name: "Daniel",
};

function createClientRepositoryMock() {
  const createTask = vi.fn();
  const deleteTask = vi.fn();
  const getTaskById = vi.fn();
  const observeUserTasks = vi.fn();
  const observeTaskThreads = vi.fn();

  const repository: BoardevClientRepository = {
    createTask,
    deleteTask,
    getTaskById,
    observeUserTasks,
    observeTaskThreads,
  };

  return {
    repository,
    createTask,
    deleteTask,
    getTaskById,
    observeUserTasks,
    observeTaskThreads,
  };
}

function createServerRepositoryMock() {
  const countTasksCreatedSince = vi.fn();
  const countThreadsCreatedSince = vi.fn();
  const getTaskVisibility = vi.fn();
  const getThread = vi.fn();
  const listReplies = vi.fn();
  const addThread = vi.fn();
  const deleteThreads = vi.fn();

  const repository: BoardevServerRepository = {
    countTasksCreatedSince,
    countThreadsCreatedSince,
    getTaskVisibility,
    getThread,
    listReplies,
    addThread,
    deleteThreads,
  };

  return {
    repository,
    countTasksCreatedSince,
    countThreadsCreatedSince,
    getTaskVisibility,
    getThread,
    listReplies,
    addThread,
    deleteThreads,
  };
}

describe("application/use-cases/boardev", () => {
  it("agrega metricas recentes a partir do repositorio", async () => {
    const { repository, countTasksCreatedSince, countThreadsCreatedSince } =
      createServerRepositoryMock();

    countTasksCreatedSince.mockResolvedValue(8);
    countThreadsCreatedSince.mockResolvedValue(13);

    await expect(getLast30DaysMetricsUseCase(repository)).resolves.toEqual({
      tasksLast30Days: 8,
      commentsLast30Days: 13,
    });
  });

  it("bloqueia acesso a tarefa compartilhada privada", async () => {
    const { repository, getTaskById } = createClientRepositoryMock();

    getTaskById.mockResolvedValue({
      id: "task-1",
      task: "Tarefa privada",
      user: "Daniel",
      email: "daniel@example.com",
      isPublic: false,
      createdAt: new Date("2026-05-04T12:00:00.000Z"),
    });

    await expect(getSharedTaskUseCase(repository, "task-1")).rejects.toMatchObject({
      statusCode: 403,
      message: "Esta tarefa e privada e nao pode ser compartilhada.",
    });
  });

  it("cria comentario quando a tarefa e publica e o pai e valido", async () => {
    const { repository, getTaskVisibility, getThread, addThread } = createServerRepositoryMock();

    getTaskVisibility.mockResolvedValue({ exists: true, isPublic: true });
    getThread.mockResolvedValue({ id: "parent-1", parentId: null, authorEmail: viewer.email });

    await createThreadUseCase(repository, viewer, {
      taskId: " task-1 ",
      message: "  Minha resposta ",
      parentId: " parent-1 ",
    });

    expect(addThread).toHaveBeenCalledWith(viewer, {
      taskId: "task-1",
      message: "Minha resposta",
      parentId: "parent-1",
    });
  });

  it("bloqueia exclusao de thread com respostas de outro usuario", async () => {
    const { repository, getThread, listReplies, deleteThreads } = createServerRepositoryMock();

    getThread.mockResolvedValue({ id: "root-1", parentId: null, authorEmail: viewer.email });
    listReplies.mockResolvedValue([
      { id: "reply-1", authorEmail: "outro@example.com" },
    ]);

    await expect(
      deleteThreadUseCase(repository, viewer, {
        taskId: "task-1",
        commentId: "root-1",
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "Nao e possivel excluir a thread com respostas de outros usuarios.",
    });

    expect(deleteThreads).not.toHaveBeenCalled();
  });

  it("exclui thread raiz e respostas do mesmo autor", async () => {
    const { repository, getThread, listReplies, deleteThreads } = createServerRepositoryMock();

    getThread.mockResolvedValue({ id: "root-1", parentId: null, authorEmail: viewer.email });
    listReplies.mockResolvedValue([
      { id: "reply-1", authorEmail: viewer.email },
      { id: "reply-2", authorEmail: viewer.email },
    ]);

    await deleteThreadUseCase(repository, viewer, {
      taskId: "task-1",
      commentId: "root-1",
    });

    expect(deleteThreads).toHaveBeenCalledWith("task-1", ["root-1", "reply-1", "reply-2"]);
  });
});