"use client"; // Indica que este componente deve ser renderizado no cliente, pois utiliza hooks de estado e eventos do React.

import { useEffect, useMemo, useState, ChangeEvent, type FormEvent } from "react";
import { FaTrash } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import toast from "react-hot-toast";
import { Textarea } from "../textarea/textarea";
import { db } from "../../app/services/firebaseConnection";
import {
  doc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  type Timestamp,
} from "firebase/firestore";
import Link from "next/link";

type DashboardClientProps = {
  sessionName: string;
  userEmail: string;
};

type Task = {
  id: string;
  task: string;
  isPublic: boolean;
  createdAt?: Timestamp;
};

type TaskThreadMetrics = {
  threads: number;
  comments: number;
  replies: number;
};

// UI interativa do dashboard separada como Client Component.
export function DashboardClient({ sessionName, userEmail }: DashboardClientProps) {
  const [input, setInput] = useState(""); // Estado para controlar o valor do textarea de input da tarefa.
  const [isPublic, setIsPublic] = useState(false); // Estado para controlar a checkbox de visibilidade da tarefa.
  const [tasks, setTasks] = useState<Task[]>([]); // Estado para armazenar as tarefas carregadas do Firestore.
  const [threadMetricsByTask, setThreadMetricsByTask] = useState<Record<string, TaskThreadMetrics>>({});
  const hasUserEmail = userEmail.trim().length > 0; // Verifica se o email do usuario esta presente e nao e apenas espacos em branco.
  const visibleTasks = useMemo(
    () => (hasUserEmail ? tasks : []),
    [hasUserEmail, tasks]
  ); // Se o email do usuario nao estiver presente, nao exibe nenhuma tarefa, prevenindo exibicao de tarefas sem associacao de usuario.

  useEffect(() => {
    if (!hasUserEmail) { // Se o email do usuario nao estiver presente, nao tenta carregar tarefas do Firestore, prevenindo erros de consulta e exibicao de tarefas sem associacao de usuario.
      return;
    }

    const tasksRef = collection(db, "tasks");
    // Evita query composta (where + orderBy) para nao depender de indice manual no Firestore.
    const q = query(tasksRef, where("email", "==", userEmail.trim()));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedTasks = snapshot.docs
          .map((doc) => {
            const data = doc.data() as Partial<Task>;
            return {
              id: doc.id,
              task: typeof data.task === "string" ? data.task : "",
              isPublic: Boolean(data.isPublic),
              createdAt: data.createdAt,
            };
          })
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() ?? 0; // Converte createdAt para timestamp numérico para ordenação, tratando casos onde createdAt pode ser indefinido ou não um Timestamp válido.
            const bTime = b.createdAt?.toMillis?.() ?? 0; // Mesma conversão para bTime, garantindo que tarefas sem createdAt sejam tratadas como mais antigas.
            return bTime - aTime;
          });

        setTasks(loadedTasks);
      },
      (error) => {
        console.error("Erro ao carregar tarefas:", error);
        toast.error("Nao foi possivel carregar suas tarefas.");
      }
    );

    return () => unsubscribe(); // Limpa o listener do Firestore quando o componente for desmontado ou quando o email do usuario mudar, prevenindo vazamento de memoria e consultas desnecessarias.
  }, [hasUserEmail, userEmail]); // O useEffect depende de hasUserEmail e userEmail para recarregar as tarefas corretamente quando o email do usuario mudar, garantindo que as tarefas exibidas estejam sempre associadas ao usuario correto.

  useEffect(() => {
    if (visibleTasks.length === 0) {
      return;
    }

    const publicTasks = visibleTasks.filter((task) => task.isPublic);
    if (publicTasks.length === 0) {
      return;
    }

    const unsubscribers = publicTasks.map((task) =>
      onSnapshot(
        collection(db, "tasks", task.id, "threads"),
        (snapshot) => {
          let threads = 0;

          for (const item of snapshot.docs) {
            const data = item.data() as { parentId?: string | null };
            if (!data.parentId) {
              threads += 1;
            }
          }

          const comments = snapshot.size;
          const replies = comments - threads;

          setThreadMetricsByTask((current) => ({
            ...current,
            [task.id]: { threads, comments, replies },
          }));
        },
        (error) => {
          console.error("Erro ao carregar contadores de threads:", error);
        }
      )
    );

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }, [visibleTasks]);

  function handleChangePublic(event: ChangeEvent<HTMLInputElement>) {
    setIsPublic(event.target.checked);
  }

  async function handleRegisterTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!input.trim()) {
      toast.error("Por favor, digite uma tarefa.");
      return;
    }

    if (!hasUserEmail) {
      toast.error("Sessao invalida. Faca login novamente para salvar tarefas.");
      return;
    }

    try {
      await addDoc(collection(db, "tasks"), {
        task: input,
        user: sessionName, // Armazena o nome do usuario para associar a task
        email: userEmail.trim(), // Armazena email validado para associar a task
        isPublic,
        createdAt: new Date(), // Adiciona timestamp para ordenacao futura
      });
      console.log("Tarefa salva com sucesso!");
      toast.success("Tarefa salva com sucesso!");
      setInput("");
      setIsPublic(false);
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
      toast.error("Erro ao salvar a tarefa.");
    }
  }

  async function handleShareTask(taskId: string) {
    const shareUrl = `${window.location.origin}/task/${taskId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link de compartilhamento copiado.");
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      toast.error("Nao foi possivel copiar o link.");
    }
  }

  async function handleDeleteTask(taskId: string) {
    const shouldDelete = window.confirm("Tem certeza que deseja excluir esta task?"); // Confirmação simples para evitar exclusão acidental de tarefas, melhorando a experiência do usuário e prevenindo perda de dados sem querer.
    if (!shouldDelete) {
      return;
    }

    try {
      await deleteDoc(doc(db, "tasks", taskId));
      toast.success("Task removida com sucesso.");
    } catch (error) {
      console.error("Erro ao remover task:", error);
      toast.error("Erro ao remover a task.");
    }
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
          {!hasUserEmail ? ( // Exibe alerta se o email do usuario nao estiver presente, indicando que a sessao esta invalida ou incompleta.
            <p className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              Nao foi possivel identificar seu email de sessao. Faca login novamente para criar tarefas.
            </p>
          ) : null}

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
            disabled={!hasUserEmail} // Desabilita o botao se o email do usuario nao estiver presente, prevenindo criacao de tarefas sem associacao de usuario.
            className="w-full cursor-pointer rounded-lg bg-white py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Salvar task
          </button>
        </form>
      </section>

      <section className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-4 sm:px-6 sm:py-5">
        <h2 className="mb-4 text-base font-semibold text-white">My tasks</h2>
        {visibleTasks.length === 0 ? (
          <p className="text-sm text-zinc-400">Voce ainda nao criou nenhuma task.</p>
        ) : (
          <div className="space-y-3">
            {visibleTasks.map((task) => (
              <article key={task.id} className="rounded-md border border-zinc-600 bg-zinc-800 px-4 py-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-zinc-300">{task.isPublic ? "PUBLIC" : "PRIVATE"}</label>
                  {task.isPublic ? (
                    <button
                      type="button"
                      onClick={() => handleShareTask(task.id)}
                      className="cursor-pointer text-sm text-zinc-300 transition-colors hover:text-white"
                    >
                      <FiShare2 size={16} />
                    </button>
                  ) : null}
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-white">
                  {task.isPublic ? ( // Se a tarefa for publica, exibe o link para a pagina de compartilhamento da tarefa, permitindo que o usuario acesse a tarefa compartilhada e copie o link facilmente. Se a tarefa for privada, exibe apenas o texto da tarefa sem link, garantindo que tarefas privadas nao sejam acessiveis publicamente.
                    <Link
                      href={`/task/${task.id}`}
                      className="underline decoration-zinc-500 underline-offset-4 transition-colors hover:text-zinc-200"
                    >
                      {task.task}
                    </Link>
                  ) : (
                    <p>{task.task}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    title="Deletar tarefa"
                    className="shrink-0 cursor-pointer text-zinc-300 transition-colors hover:text-red-400"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
                {task.isPublic ? (
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
                    <span className="rounded-full border border-zinc-600 px-2 py-0.5">
                      {threadMetricsByTask[task.id]?.threads ?? 0} thread
                      {(threadMetricsByTask[task.id]?.threads ?? 0) === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full border border-zinc-600 px-2 py-0.5">
                      {threadMetricsByTask[task.id]?.comments ?? 0} comentario
                      {(threadMetricsByTask[task.id]?.comments ?? 0) === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full border border-zinc-600 px-2 py-0.5">
                      {threadMetricsByTask[task.id]?.replies ?? 0} resposta
                      {(threadMetricsByTask[task.id]?.replies ?? 0) === 1 ? "" : "s"}
                    </span>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
