import { afterEach, describe, expect, it, vi } from "vitest";

const adminMocks = vi.hoisted(() => ({
  getAdminDb: vi.fn(),
  fromDate: vi.fn((value: Date) => ({ kind: "fromDate", value })),
  now: vi.fn(() => ({ kind: "now" })),
}));

vi.mock("firebase-admin/firestore", () => ({
  Timestamp: {
    fromDate: adminMocks.fromDate,
    now: adminMocks.now,
  },
}));

vi.mock("./admin-db", () => ({
  getAdminDb: adminMocks.getAdminDb,
}));

import { firebaseServerBoardevRepository } from "./server-boardev-repository";

describe("infrastructure/firebase/server-boardev-repository", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("conta tarefas recentes usando a janela informada", async () => {
    const get = vi.fn().mockResolvedValue({ size: 7 });
    const where = vi.fn().mockReturnValue({ get });
    const collection = vi.fn().mockReturnValue({ where });

    adminMocks.getAdminDb.mockReturnValue({ collection });

    const since = new Date("2026-04-04T00:00:00.000Z");

    await expect(firebaseServerBoardevRepository.countTasksCreatedSince(since)).resolves.toBe(7);
    expect(collection).toHaveBeenCalledWith("tasks");
    expect(adminMocks.fromDate).toHaveBeenCalledWith(since);
    expect(where).toHaveBeenCalledWith("createdAt", ">=", { kind: "fromDate", value: since });
  });

  it("mapeia a visibilidade da tarefa", async () => {
    const get = vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({ isPublic: 1 }),
    });
    const doc = vi.fn().mockReturnValue({ get });
    const collection = vi.fn().mockReturnValue({ doc });

    adminMocks.getAdminDb.mockReturnValue({ collection });

    await expect(firebaseServerBoardevRepository.getTaskVisibility("task-1")).resolves.toEqual({
      exists: true,
      isPublic: true,
    });
  });

  it("remove todos os ids informados no mesmo batch", async () => {
    const threadCollection = {
      doc: vi.fn((threadId: string) => `threads/${threadId}`),
    };
    const taskDocument = {
      collection: vi.fn(() => threadCollection),
    };
    const tasksCollection = {
      doc: vi.fn(() => taskDocument),
    };
    const batch = {
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    const db = {
      batch: vi.fn(() => batch),
      collection: vi.fn(() => tasksCollection),
    };

    adminMocks.getAdminDb.mockReturnValue(db);

    await firebaseServerBoardevRepository.deleteThreads("task-1", ["root-1", "reply-1"]);

    expect(batch.delete).toHaveBeenNthCalledWith(1, "threads/root-1");
    expect(batch.delete).toHaveBeenNthCalledWith(2, "threads/reply-1");
    expect(batch.commit).toHaveBeenCalledOnce();
  });
});
