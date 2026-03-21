"use client"; // Indica que este componente deve ser renderizado no cliente, pois utiliza hooks de estado e eventos do React.

import { useState, ChangeEvent, type FormEvent } from "react";
import { FaTrash } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import toast from "react-hot-toast";
import { Textarea } from "../textarea/textarea";

type DashboardClientProps = {
  sessionName: string;
};

// UI interativa do dashboard separada como Client Component.
export function DashboardClient({ sessionName }: DashboardClientProps) {
  const [input, setInput] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  function handleChangePublic(event: ChangeEvent<HTMLInputElement>) {
    setIsPublic(event.target.checked);
  }

  function handleRegisterTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!input.trim()) {
      toast.error("Por favor, digite uma tarefa.");
      return;
    }

    toast.success(
      isPublic ? "Task publica salva com sucesso." : "Task privada salva com sucesso."
    );
    setInput("");
    setIsPublic(false);
  }

  function handleShareTask() {
    toast("Link de compartilhamento copiado.", { icon: "🔗" });
  }

  function handleDeleteTask() {
    toast.success("Task removida com sucesso.");
  }


  return (
    <main className="mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10">
      {/* Saudacao ao usuario autenticado */}
      <div>
        <h1 className="text-xl font-bold text-white sm:text-3xl">
          Ola, {sessionName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">O que voce quer organizar hoje?</p>
      </div>

      {/* Card para criacao de nova task */}
      <section className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-4 sm:px-6 sm:py-5">
        <h2 className="mb-4 text-base font-semibold text-white">Nova task</h2>
        <form onSubmit={handleRegisterTask} className="flex flex-col gap-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua tarefa..."
            name="task"
            required
          />

          {/* Opcao de visibilidade */}
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="public"
              checked={isPublic}
              onChange={handleChangePublic}
              className="h-4 w-4 cursor-pointer accent-white"
            />
            <span className="text-sm text-zinc-300">Deixar task publica</span>
          </label>

          {/* Botao de envio */}
          <button
            type="submit"
            className="w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Salvar task
          </button>
        </form>
      </section>

      <section className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-4 sm:px-6 sm:py-5">
        <h2 className="mb-4 text-base font-semibold text-white">My tasks</h2>
        <article className="rounded-md border border-zinc-600 bg-zinc-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-zinc-300">PUBLIC</label>
            <button
              type="button"
              onClick={handleShareTask}
              className="text-sm text-zinc-300 transition-colors hover:text-white"
            >
              <FiShare2 size={16} />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-white">
            <p>Estudar para a prova de matematica</p>
            <button
              type="button"
              onClick={handleDeleteTask}
              title="Deletar tarefa"
              className="shrink-0 text-zinc-300 transition-colors hover:text-red-400"
            >
              <FaTrash size={16} />
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}
