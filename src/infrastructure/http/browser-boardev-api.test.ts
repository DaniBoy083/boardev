import { afterEach, describe, expect, it, vi } from "vitest";
import { browserBoardevApi } from "./browser-boardev-api";

describe("infrastructure/http/browser-boardev-api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("busca metricas no endpoint esperado", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ tasksLast30Days: 6, commentsLast30Days: 11 }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(browserBoardevApi.getLast30DaysMetrics()).resolves.toEqual({
      tasksLast30Days: 6,
      commentsLast30Days: 11,
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/metrics/last-30-days", {
      method: "GET",
      cache: "no-store",
    });
  });

  it("propaga a mensagem retornada pela API ao criar comentario", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Comentario bloqueado." }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      browserBoardevApi.createThread({
        taskId: "task-1",
        message: "Novo comentario",
        parentId: null,
      })
    ).rejects.toThrow("Comentario bloqueado.");
  });

  it("usa a mensagem padrao quando a resposta de exclusao nao retorna JSON valido", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("falha interna", {
        status: 500,
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      browserBoardevApi.deleteThread({
        taskId: "task-1",
        commentId: "comment-1",
      })
    ).rejects.toThrow("Falha ao remover comentario.");
  });
});
