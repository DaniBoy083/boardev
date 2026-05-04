import { afterEach, describe, expect, it, vi } from "vitest";

const firestoreMocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  db: { name: "mock-db" },
}));

vi.mock("firebase/firestore", () => ({
  addDoc: firestoreMocks.addDoc,
  collection: firestoreMocks.collection,
  deleteDoc: firestoreMocks.deleteDoc,
  doc: firestoreMocks.doc,
  getDoc: firestoreMocks.getDoc,
  onSnapshot: firestoreMocks.onSnapshot,
  orderBy: firestoreMocks.orderBy,
  query: firestoreMocks.query,
  where: firestoreMocks.where,
}));

vi.mock("./client-db", () => ({
  db: firestoreMocks.db,
}));

import { firebaseClientBoardevRepository } from "./client-boardev-repository";

describe("infrastructure/firebase/client-boardev-repository", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("cria tarefa com timestamp atual", async () => {
    firestoreMocks.collection.mockReturnValue("tasks-collection");
    firestoreMocks.addDoc.mockResolvedValue(undefined);

    await firebaseClientBoardevRepository.createTask({
      task: "Organizar estudos",
      user: "Daniel",
      email: "daniel@example.com",
      isPublic: true,
    });

    expect(firestoreMocks.collection).toHaveBeenCalledWith(firestoreMocks.db, "tasks");
    expect(firestoreMocks.addDoc).toHaveBeenCalledWith(
      "tasks-collection",
      expect.objectContaining({
        task: "Organizar estudos",
        user: "Daniel",
        email: "daniel@example.com",
        isPublic: true,
        createdAt: expect.any(Date),
      })
    );
  });

  it("mapeia uma tarefa do Firestore para o contrato do dominio", async () => {
    firestoreMocks.doc.mockReturnValue("task-doc-ref");
    firestoreMocks.getDoc.mockResolvedValue({
      exists: () => true,
      id: "task-1",
      data: () => ({
        task: "Ler documentacao",
        user: "Daniel",
        email: "daniel@example.com",
        isPublic: true,
        createdAt: {
          toDate: () => new Date("2026-05-04T12:00:00.000Z"),
        },
      }),
    });

    await expect(firebaseClientBoardevRepository.getTaskById("task-1")).resolves.toEqual({
      id: "task-1",
      task: "Ler documentacao",
      user: "Daniel",
      email: "daniel@example.com",
      isPublic: true,
      createdAt: new Date("2026-05-04T12:00:00.000Z"),
    });
  });

  it("observa threads e normaliza falhas do listener", () => {
    const onThreads = vi.fn();
    const onError = vi.fn();
    const unsubscribe = vi.fn();

    firestoreMocks.collection.mockReturnValue("threads-collection");
    firestoreMocks.orderBy.mockReturnValue("createdAt-asc");
    firestoreMocks.query.mockReturnValue("threads-query");
    firestoreMocks.onSnapshot.mockImplementation((_query, onNext, onSnapshotError) => {
      onNext({
        docs: [
          {
            id: "thread-1",
            data: () => ({
              message: "Primeiro comentario",
              authorName: "Daniel",
              authorEmail: "daniel@example.com",
              parentId: "",
              createdAt: {
                toDate: () => new Date("2026-05-04T15:00:00.000Z"),
              },
            }),
          },
        ],
      });
      onSnapshotError("falha no listener");
      return unsubscribe;
    });

    const returnedUnsubscribe = firebaseClientBoardevRepository.observeTaskThreads(
      "task-1",
      onThreads,
      onError
    );

    expect(onThreads).toHaveBeenCalledWith([
      {
        id: "thread-1",
        message: "Primeiro comentario",
        authorName: "Daniel",
        authorEmail: "daniel@example.com",
        parentId: null,
        createdAt: new Date("2026-05-04T15:00:00.000Z"),
      },
    ]);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(returnedUnsubscribe).toBe(unsubscribe);
  });
});
