import { afterEach, describe, expect, it, vi } from "vitest";
import { firebaseServerBoardevRepository } from "@/src/infrastructure/firebase/server-boardev-repository";
import { GET } from "./route";

describe("app/api/metrics/last-30-days/route", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retorna as metricas agregadas quando a consulta funciona", async () => {
    vi.spyOn(firebaseServerBoardevRepository, "countTasksCreatedSince").mockResolvedValue(4);
    vi.spyOn(firebaseServerBoardevRepository, "countThreadsCreatedSince").mockResolvedValue(9);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      tasksLast30Days: 4,
      commentsLast30Days: 9,
    });
  });

  it("retorna fallback seguro quando a agregacao falha", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    vi.spyOn(firebaseServerBoardevRepository, "countTasksCreatedSince").mockRejectedValue(
      new Error("boom")
    );

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      tasksLast30Days: 0,
      commentsLast30Days: 0,
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
