import type { BoardevApi } from "@/src/application/ports/boardev-api";
import type {
  CreateThreadInput,
  DeleteThreadInput,
  MetricsSnapshot,
} from "@/src/domain/boardev";

async function readApiErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export const browserBoardevApi: BoardevApi = {
  async getLast30DaysMetrics(): Promise<MetricsSnapshot> {
    const response = await fetch("/api/metrics/last-30-days", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Falha ao carregar metricas: ${response.status}`);
    }

    return (await response.json()) as MetricsSnapshot;
  },

  async createThread(input: CreateThreadInput): Promise<void> {
    const response = await fetch("/api/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(await readApiErrorMessage(response, "Falha ao criar comentario."));
    }
  },

  async deleteThread(input: DeleteThreadInput): Promise<void> {
    const response = await fetch("/api/threads", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(await readApiErrorMessage(response, "Falha ao remover comentario."));
    }
  },
};