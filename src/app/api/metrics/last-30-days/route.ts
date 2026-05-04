import { NextResponse } from "next/server";
import { getLast30DaysMetricsUseCase } from "@/src/application/use-cases/boardev";
import { firebaseServerBoardevRepository } from "@/src/infrastructure/firebase/server-boardev-repository";

// Forca resposta dinamica para evitar cache estatico de metricas.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(
      await getLast30DaysMetricsUseCase(firebaseServerBoardevRepository)
    );
  } catch (error) {
    // Fallback seguro para nao quebrar a home se a agregacao falhar.
    console.error("Erro ao gerar metricas dos ultimos 30 dias:", error);
    return NextResponse.json(
      { tasksLast30Days: 0, commentsLast30Days: 0 },
      { status: 500 }
    );
  }
}
