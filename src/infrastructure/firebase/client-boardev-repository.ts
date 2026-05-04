import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase/firestore";
import type { BoardevClientRepository } from "@/src/application/ports/boardev-client-repository";
import { db } from "@/src/infrastructure/firebase/client-db";
import type {
  CreateTaskInput,
  TaskRecord,
  ThreadRecord,
} from "@/src/domain/boardev";

type RawTaskDocument = {
  task?: unknown;
  user?: unknown;
  email?: unknown;
  isPublic?: unknown;
  createdAt?: unknown;
};

type RawThreadDocument = {
  message?: unknown;
  authorName?: unknown;
  authorEmail?: unknown;
  parentId?: unknown;
  createdAt?: unknown;
};

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate();
  }

  return null;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error("Erro inesperado ao acessar o Firestore.");
}

function mapTaskDocument(snapshot: DocumentSnapshot<DocumentData>): TaskRecord {
  const data = (snapshot.data() ?? {}) as RawTaskDocument;

  return {
    id: snapshot.id,
    task: typeof data.task === "string" ? data.task : "",
    user: typeof data.user === "string" ? data.user : null,
    email: typeof data.email === "string" ? data.email : null,
    isPublic: Boolean(data.isPublic),
    createdAt: toDate(data.createdAt),
  };
}

function mapThreadDocument(snapshot: DocumentSnapshot<DocumentData>): ThreadRecord {
  const data = (snapshot.data() ?? {}) as RawThreadDocument;

  return {
    id: snapshot.id,
    message: typeof data.message === "string" ? data.message : "",
    authorName: typeof data.authorName === "string" ? data.authorName : "Visitante",
    authorEmail: typeof data.authorEmail === "string" ? data.authorEmail : null,
    parentId: typeof data.parentId === "string" && data.parentId.length > 0 ? data.parentId : null,
    createdAt: toDate(data.createdAt),
  };
}

export const firebaseClientBoardevRepository: BoardevClientRepository = {
  async createTask(input: CreateTaskInput): Promise<void> {
    await addDoc(collection(db, "tasks"), {
      task: input.task,
      user: input.user,
      email: input.email,
      isPublic: input.isPublic,
      createdAt: new Date(),
    });
  },

  async deleteTask(taskId: string): Promise<void> {
    await deleteDoc(doc(db, "tasks", taskId));
  },

  async getTaskById(taskId: string): Promise<TaskRecord | null> {
    const taskSnapshot = await getDoc(doc(db, "tasks", taskId));
    if (!taskSnapshot.exists()) {
      return null;
    }

    return mapTaskDocument(taskSnapshot);
  },

  observeUserTasks(userEmail, onTasks, onError): () => void {
    const tasksQuery = query(
      collection(db, "tasks"),
      where("email", "==", userEmail),
    );

    return onSnapshot(
      tasksQuery,
      (snapshot) => {
        onTasks(snapshot.docs.map(mapTaskDocument));
      },
      (error) => onError(toError(error)),
    );
  },

  observeTaskThreads(taskId, onThreads, onError): () => void {
    const threadsQuery = query(
      collection(db, "tasks", taskId, "threads"),
      orderBy("createdAt", "asc"),
    );

    return onSnapshot(
      threadsQuery,
      (snapshot) => {
        onThreads(snapshot.docs.map(mapThreadDocument));
      },
      (error) => onError(toError(error)),
    );
  },
};