"use client";

// Componente da pagina inicial (rota "/").
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  // Total de tarefas criadas nos ultimos 30 dias.
  const [tasksLast30Days, setTasksLast30Days] = useState(0);
  // Total de comentarios criados nos ultimos 30 dias.
  const [commentsLast30Days, setCommentsLast30Days] = useState(0);

  useEffect(() => {
    // Evita setState apos desmontagem do componente.
    let isMounted = true;

    // Busca as metricas agregadas no backend (sem listeners pesados no cliente).
    async function loadMetrics() {
      try {
        const response = await fetch("/api/metrics/last-30-days", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Falha ao carregar metricas: ${response.status}`);
        }

        const data = (await response.json()) as {
          tasksLast30Days: number;
          commentsLast30Days: number;
        };

        if (!isMounted) {
          return;
        }

        setTasksLast30Days(data.tasksLast30Days ?? 0);
        setCommentsLast30Days(data.commentsLast30Days ?? 0);
      } catch (error) {
        console.error("Erro ao carregar metricas dos ultimos 30 dias:", error);
      }
    }

    // Carrega na entrada da pagina.
    void loadMetrics();
    // Revalida a cada 60s para manter os cards relativamente atualizados.
    const intervalId = window.setInterval(() => {
      void loadMetrics();
    }, 60000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  // Exibe destaque visual com contadores resumidos.
  return (
    <div className="w-full bg-black text-white">
      <main className="mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6">
        {/* Titulo principal — sem <br> para nao quebrar o layout em mobile */}
        <h1 className="mt-8 text-center text-2xl font-semibold leading-tight sm:text-4xl">
          Sistema feito para desenvolvedores organizarem suas tarefas de forma simples e rapida
        </h1>
        {/* Cards de metricas/estatisticas */}
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <section className="rounded-md border border-white bg-white px-5 py-3">
            <span className="font-semibold text-black">+{tasksLast30Days} tarefas (30 dias)</span>
          </section>
          <section className="rounded-md border border-white bg-white px-5 py-3">
            <span className="font-semibold text-black">+{commentsLast30Days} comentarios (30 dias)</span>
          </section>
        </div>
      </main>
    </div>
  );
}
