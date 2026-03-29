"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../../services/firebaseConnection";

type Task = {
  task: string;
  isPublic: boolean;
  createdAt?: Timestamp;
};

type ThreadComment = {
  id: string;
  message: string;
  authorName: string;
  authorEmail: string | null;
  parentId: string | null;
  createdAt?: Timestamp;
};

export default function SharedTaskPage() {
  const { data: session } = useSession();
  const params = useParams<{ id: string }>();
  const taskId = params?.id;

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [pendingParentId, setPendingParentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadTask() {
      if (!taskId) {
        setErrorMessage("Link invalido.");
        setIsLoading(false);
        return;
      }

      try {
        const taskDoc = await getDoc(doc(db, "tasks", taskId));

        if (!taskDoc.exists()) {
          setErrorMessage("Tarefa nao encontrada.");
          setIsLoading(false);
          return;
        }

        const data = taskDoc.data() as Partial<Task>;
        if (!data.isPublic) {
          setErrorMessage("Esta tarefa e privada e nao pode ser compartilhada.");
          setIsLoading(false);
          return;
        }

        setTask({
          task: typeof data.task === "string" ? data.task : "",
          isPublic: Boolean(data.isPublic),
          createdAt: data.createdAt,
        });
      } catch (error) {
        console.error("Erro ao carregar tarefa compartilhada:", error);
        setErrorMessage("Nao foi possivel carregar a tarefa.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadTask();
  }, [taskId]);

  useEffect(() => {
    if (!taskId || !task?.isPublic) {
      return;
    }

    const threadRef = collection(db, "tasks", taskId, "threads");
    const q = query(threadRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedComments = snapshot.docs.map((item) => {
          const data = item.data() as Partial<ThreadComment>;
          return {
            id: item.id,
            message: typeof data.message === "string" ? data.message : "",
            authorName: typeof data.authorName === "string" ? data.authorName : "Visitante",
            authorEmail: typeof data.authorEmail === "string" ? data.authorEmail : null,
            parentId: typeof data.parentId === "string" ? data.parentId : null,
            createdAt: data.createdAt,
          };
        });

        setComments(loadedComments);
      },
      (error) => {
        console.error("Erro ao carregar comentarios:", error);
      }
    );

    return () => unsubscribe();
  }, [taskId, task?.isPublic]);

  const repliesByParent = useMemo(() => {
    const grouped = new Map<string, ThreadComment[]>();

    for (const comment of comments) {
      if (!comment.parentId) {
        continue;
      }

      const parentReplies = grouped.get(comment.parentId) ?? [];
      parentReplies.push(comment);
      grouped.set(comment.parentId, parentReplies);
    }

    return grouped;
  }, [comments]);

  const rootComments = useMemo(
    () => comments.filter((comment) => !comment.parentId),
    [comments]
  );
  const replyCount = comments.length - rootComments.length;

  const viewerName = session?.user?.name?.trim() || "Visitante";
  const viewerEmail = session?.user?.email?.trim() || null;

  function canDeleteComment(authorEmail: string | null): boolean {
    return Boolean(viewerEmail && authorEmail && viewerEmail === authorEmail);
  }

  async function handleCreateComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!viewerEmail) {
      toast.error("Faca login para comentar.");
      return;
    }

    const message = newComment.trim();
    if (!message || !taskId) {
      return;
    }

    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
          message,
          parentId: null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message ?? "Falha ao criar comentario.");
      }

      setNewComment("");
      toast.success("Comentario enviado.");
    } catch (error) {
      console.error("Erro ao enviar comentario:", error);
      toast.error("Nao foi possivel enviar o comentario.");
    }
  }

  async function handleCreateReply(parentId: string) {
    if (!viewerEmail) {
      toast.error("Faca login para responder.");
      return;
    }

    const message = (replyDrafts[parentId] ?? "").trim();
    if (!message || !taskId) {
      return;
    }

    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
          message,
          parentId,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message ?? "Falha ao criar resposta.");
      }

      setReplyDrafts((current) => ({ ...current, [parentId]: "" }));
      setPendingParentId(null);
      toast.success("Resposta enviada.");
    } catch (error) {
      console.error("Erro ao enviar resposta:", error);
      toast.error("Nao foi possivel enviar a resposta.");
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!taskId) {
      return;
    }

    const targetComment = comments.find((item) => item.id === commentId);
    if (!targetComment) {
      toast.error("Comentario nao encontrado.");
      return;
    }

    if (!canDeleteComment(targetComment.authorEmail)) {
      toast.error("Voce so pode excluir seus proprios comentarios.");
      return;
    }

    const shouldDelete = window.confirm("Tem certeza que deseja excluir este comentario?");
    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch("/api/threads", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
          commentId,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message ?? "Falha ao remover comentario.");
      }

      setPendingParentId((current) => (current === commentId ? null : current));

      toast.success("Comentario removido com sucesso.");
    } catch (error) {
      console.error("Erro ao remover comentario:", error);
      toast.error("Nao foi possivel remover o comentario.");
    }
  }

  function formatCommentDate(timestamp?: Timestamp) {
    if (!timestamp?.toDate) {
      return "agora";
    }

    return timestamp.toDate().toLocaleString("pt-BR");
  }

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-2xl items-center justify-center px-4 py-12">
        <p className="text-sm text-zinc-300">Carregando tarefa...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-2xl flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <p className="text-sm text-red-300">{errorMessage}</p>
        <Link href="/" className="text-sm text-zinc-200 underline underline-offset-4 hover:text-white">
          Voltar para a home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-white">Detalhes da tarefa</h1>
      <section className="rounded-xl border border-zinc-700 bg-zinc-900 p-5">
        <p className="text-sm uppercase tracking-wide text-zinc-400">Publica</p>
        <p className="mt-3 text-base text-zinc-100">{task?.task}</p>
      </section>

      <section className="rounded-xl border border-zinc-700 bg-zinc-900 p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Comentários</h2>
          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
            <span className="rounded-full border border-zinc-600 px-2 py-1">
              {rootComments.length} thread{rootComments.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-zinc-600 px-2 py-1">
              {comments.length} comentario{comments.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-zinc-600 px-2 py-1">
              {replyCount} resposta{replyCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <form onSubmit={handleCreateComment} className="mb-6 flex flex-col gap-3">
          <textarea
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            placeholder="Escreva um comentario para iniciar uma thread..."
            className="min-h-24 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-zinc-400"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-500">Comentando como {viewerName}</span>
            <button
              type="submit"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              Comentar
            </button>
          </div>
        </form>

        {rootComments.length === 0 ? (
          <p className="text-sm text-zinc-400">Seja a primeira pessoa a comentar.</p>
        ) : (
          <div className="space-y-4">
            {rootComments.map((comment) => {
              const replies = repliesByParent.get(comment.id) ?? [];

              return (
                <article key={comment.id} className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
                  <header className="mb-2 flex items-center justify-between gap-2">
                    <strong className="text-sm text-white">{comment.authorName}</strong>
                    <span className="text-xs text-zinc-500">{formatCommentDate(comment.createdAt)}</span>
                  </header>
                  <p className="text-sm leading-relaxed text-zinc-100">{comment.message}</p>

                  <div className="mt-3">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setPendingParentId((current) => (current === comment.id ? null : comment.id))
                        }
                        className="text-xs font-medium text-zinc-300 underline underline-offset-4 hover:text-white"
                      >
                        Responder
                      </button>
                      {canDeleteComment(comment.authorEmail) ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          title="Excluir comentario"
                          className="shrink-0 text-zinc-300 transition-colors hover:text-red-400"
                        >
                          <FaTrash size={14} />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {pendingParentId === comment.id ? (
                    <div className="mt-3 rounded-md border border-zinc-700 bg-zinc-900 p-3">
                      <textarea
                        value={replyDrafts[comment.id] ?? ""}
                        onChange={(event) =>
                          setReplyDrafts((current) => ({
                            ...current,
                            [comment.id]: event.target.value,
                          }))
                        }
                        placeholder="Escreva sua resposta..."
                        className="min-h-20 w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-zinc-400"
                      />
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPendingParentId(null)}
                          className="rounded-md border border-zinc-500 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateReply(comment.id)}
                          className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-black hover:bg-zinc-200"
                        >
                          Enviar resposta
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {replies.length > 0 ? (
                    <div className="mt-4 space-y-3 border-l border-zinc-600 pl-4">
                      {replies.map((reply) => (
                        <div key={reply.id} className="rounded-md border border-zinc-700 bg-zinc-900 p-3">
                          <header className="mb-1 flex items-center justify-between gap-2">
                            <strong className="text-xs text-zinc-100">{reply.authorName}</strong>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-zinc-500">
                                {formatCommentDate(reply.createdAt)}
                              </span>
                              {canDeleteComment(reply.authorEmail) ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(reply.id)}
                                  title="Excluir resposta"
                                  className="shrink-0 text-zinc-300 transition-colors hover:text-red-400"
                                >
                                  <FaTrash size={12} />
                                </button>
                              ) : null}
                            </div>
                          </header>
                          <p className="text-sm text-zinc-200">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Link href="/" className="text-sm text-zinc-200 underline underline-offset-4 hover:text-white">
        Ir para a home
      </Link>
    </main>
  );
}
