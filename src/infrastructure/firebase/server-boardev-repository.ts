import { Timestamp } from "firebase-admin/firestore";
import type { BoardevServerRepository } from "@/src/application/ports/boardev-server-repository";
import { getAdminDb } from "@/src/infrastructure/firebase/admin-db";
import type { CreateThreadInput, ViewerIdentity } from "@/src/domain/boardev";

type TaskDocument = {
  isPublic?: unknown;
};

type ThreadDocument = {
  parentId?: unknown;
  authorEmail?: unknown;
};

function normalizeParentId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

export const firebaseServerBoardevRepository: BoardevServerRepository = {
  async countTasksCreatedSince(since: Date): Promise<number> {
    const snapshot = await getAdminDb()
      .collection("tasks")
      .where("createdAt", ">=", Timestamp.fromDate(since))
      .get();

    return snapshot.size;
  },

  async countThreadsCreatedSince(since: Date): Promise<number> {
    const snapshot = await getAdminDb()
      .collectionGroup("threads")
      .where("createdAt", ">=", Timestamp.fromDate(since))
      .get();

    return snapshot.size;
  },

  async getTaskVisibility(taskId: string) {
    const taskSnapshot = await getAdminDb().collection("tasks").doc(taskId).get();

    if (!taskSnapshot.exists) {
      return {
        exists: false,
        isPublic: false,
      };
    }

    const data = taskSnapshot.data() as TaskDocument | undefined;

    return {
      exists: true,
      isPublic: Boolean(data?.isPublic),
    };
  },

  async getThread(taskId: string, threadId: string) {
    const threadSnapshot = await getAdminDb()
      .collection("tasks")
      .doc(taskId)
      .collection("threads")
      .doc(threadId)
      .get();

    if (!threadSnapshot.exists) {
      return null;
    }

    const data = threadSnapshot.data() as ThreadDocument | undefined;

    return {
      id: threadSnapshot.id,
      parentId: normalizeParentId(data?.parentId),
      authorEmail: typeof data?.authorEmail === "string" ? data.authorEmail : null,
    };
  },

  async listReplies(taskId: string, parentId: string) {
    const repliesSnapshot = await getAdminDb()
      .collection("tasks")
      .doc(taskId)
      .collection("threads")
      .where("parentId", "==", parentId)
      .get();

    return repliesSnapshot.docs.map((replyDoc) => {
      const data = replyDoc.data() as ThreadDocument | undefined;

      return {
        id: replyDoc.id,
        authorEmail: typeof data?.authorEmail === "string" ? data.authorEmail : null,
      };
    });
  },

  async addThread(viewer: ViewerIdentity, input: CreateThreadInput): Promise<void> {
    await getAdminDb()
      .collection("tasks")
      .doc(input.taskId)
      .collection("threads")
      .add({
        message: input.message,
        authorName: viewer.name,
        authorEmail: viewer.email,
        parentId: input.parentId,
        createdAt: Timestamp.now(),
      });
  },

  async deleteThreads(taskId: string, threadIds: string[]): Promise<void> {
    const db = getAdminDb();
    const batch = db.batch();

    for (const threadId of threadIds) {
      const threadRef = db.collection("tasks").doc(taskId).collection("threads").doc(threadId);
      batch.delete(threadRef);
    }

    await batch.commit();
  },
};