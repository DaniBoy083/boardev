import { describe, expect, it } from "vitest";
import {
  calculateThreadMetrics,
  compareByCreatedAtDesc,
  getWindowStart,
  groupRepliesByParent,
  type TaskRecord,
  type ThreadRecord,
} from "@/src/domain/boardev";

function createThreadRecord(overrides: Partial<ThreadRecord>): ThreadRecord {
  return {
    id: overrides.id ?? "thread-1",
    message: overrides.message ?? "mensagem",
    authorName: overrides.authorName ?? "Daniel",
    authorEmail: overrides.authorEmail ?? "daniel@example.com",
    parentId: overrides.parentId ?? null,
    createdAt: overrides.createdAt ?? new Date("2026-05-04T12:00:00.000Z"),
  };
}

describe("domain/boardev", () => {
  it("calcula metricas de threads e respostas", () => {
    const metrics = calculateThreadMetrics([
      createThreadRecord({ id: "root-1", parentId: null }),
      createThreadRecord({ id: "reply-1", parentId: "root-1" }),
      createThreadRecord({ id: "root-2", parentId: null }),
    ]);

    expect(metrics).toEqual({
      threads: 2,
      comments: 3,
      replies: 1,
    });
  });

  it("agrupa respostas pelo comentario pai", () => {
    const repliesByParent = groupRepliesByParent([
      createThreadRecord({ id: "root-1", parentId: null }),
      createThreadRecord({ id: "reply-1", parentId: "root-1" }),
      createThreadRecord({ id: "reply-2", parentId: "root-1" }),
      createThreadRecord({ id: "reply-3", parentId: "root-2" }),
    ]);

    expect(repliesByParent.get("root-1")?.map((reply) => reply.id)).toEqual([
      "reply-1",
      "reply-2",
    ]);
    expect(repliesByParent.get("root-2")?.map((reply) => reply.id)).toEqual([
      "reply-3",
    ]);
  });

  it("ordena registros mais recentes primeiro", () => {
    const tasks: TaskRecord[] = [
      {
        id: "older",
        task: "older",
        user: "Daniel",
        email: "daniel@example.com",
        isPublic: false,
        createdAt: new Date("2026-04-20T10:00:00.000Z"),
      },
      {
        id: "newer",
        task: "newer",
        user: "Daniel",
        email: "daniel@example.com",
        isPublic: true,
        createdAt: new Date("2026-05-04T10:00:00.000Z"),
      },
    ];

    const sortedTasks = [...tasks].sort(compareByCreatedAtDesc);
    expect(sortedTasks.map((task) => task.id)).toEqual(["newer", "older"]);
  });

  it("calcula a janela de data a partir da referencia informada", () => {
    const now = new Date("2026-05-04T00:00:00.000Z");
    const windowStart = getWindowStart(30, now);

    expect(windowStart.toISOString()).toBe("2026-04-04T00:00:00.000Z");
  });
});