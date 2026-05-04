import { afterEach, describe, expect, it, vi } from "vitest";
import { firebaseServerBoardevRepository } from "@/src/infrastructure/firebase/server-boardev-repository";

const routeMocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: routeMocks.getServerSession,
}));

vi.mock("../auth/[...nextauth]/route", () => ({
  authOptions: {},
}));

import { DELETE, POST } from "./route";

function createJsonRequest(method: "POST" | "DELETE", body: unknown) {
  return new Request("http://localhost/api/threads", {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("app/api/threads/route", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    routeMocks.getServerSession.mockReset();
  });

  it("retorna 401 quando nao existe sessao valida", async () => {
    routeMocks.getServerSession.mockResolvedValue(null);

    const response = await POST(createJsonRequest("POST", { taskId: "task-1", message: "Oi" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" });
  });

  it("retorna 400 quando o payload de criacao e invalido", async () => {
    routeMocks.getServerSession.mockResolvedValue({
      user: {
        email: "daniel@example.com",
        name: "Daniel",
      },
    });

    const response = await POST(createJsonRequest("POST", { taskId: "", message: "" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: "Dados invalidos." });
  });

  it("cria comentario usando sessao e payload normalizados", async () => {
    routeMocks.getServerSession.mockResolvedValue({
      user: {
        email: " daniel@example.com ",
        name: " Daniel ",
      },
    });

    vi.spyOn(firebaseServerBoardevRepository, "getTaskVisibility").mockResolvedValue({
      exists: true,
      isPublic: true,
    });
    const addThreadSpy = vi
      .spyOn(firebaseServerBoardevRepository, "addThread")
      .mockResolvedValue(undefined);

    const response = await POST(
      createJsonRequest("POST", {
        taskId: " task-1 ",
        message: " comentario novo ",
        parentId: null,
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(addThreadSpy).toHaveBeenCalledWith(
      {
        email: "daniel@example.com",
        name: "Daniel",
      },
      {
        taskId: "task-1",
        message: "comentario novo",
        parentId: null,
      }
    );
  });

  it("mantem a regra de exclusao para respostas de outro usuario", async () => {
    routeMocks.getServerSession.mockResolvedValue({
      user: {
        email: "daniel@example.com",
        name: "Daniel",
      },
    });

    vi.spyOn(firebaseServerBoardevRepository, "getThread").mockResolvedValue({
      id: "root-1",
      parentId: null,
      authorEmail: "daniel@example.com",
    });
    vi.spyOn(firebaseServerBoardevRepository, "listReplies").mockResolvedValue([
      {
        id: "reply-1",
        authorEmail: "outro@example.com",
      },
    ]);
    const deleteThreadsSpy = vi
      .spyOn(firebaseServerBoardevRepository, "deleteThreads")
      .mockResolvedValue(undefined);

    const response = await DELETE(
      createJsonRequest("DELETE", {
        taskId: "task-1",
        commentId: "root-1",
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: "Nao e possivel excluir a thread com respostas de outros usuarios.",
    });
    expect(deleteThreadsSpy).not.toHaveBeenCalled();
  });
});
