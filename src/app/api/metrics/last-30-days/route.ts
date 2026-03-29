import { NextResponse } from "next/server";
import { firebaseApiKey, firebaseProjectId } from "../../../services/firebaseConnection";

// Forca resposta dinamica para evitar cache estatico de metricas.
export const dynamic = "force-dynamic";

const firestoreProjectId = process.env.FIREBASE_PROJECT_ID ?? firebaseProjectId;
const firestoreApiKey = process.env.FIREBASE_WEB_API_KEY ?? firebaseApiKey;

type FirestoreValue = {
  timestampValue?: string;
};

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

type FirestoreListResponse = {
  documents?: FirestoreDocument[];
  nextPageToken?: string;
};

function toMillis(timestampValue?: string): number {
  if (!timestampValue) {
    return Number.NaN;
  }

  return new Date(timestampValue).getTime();
}

// Regra de janela fixa de 30 dias usada pelos cards da home.
function isWithinLast30Days(timestampValue?: string): boolean {
  const millis = toMillis(timestampValue);
  if (!Number.isFinite(millis)) {
    return false;
  }

  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return millis >= since;
}

// Monta endpoint REST do Firestore para listar documentos de qualquer colecao/subcolecao.
function getCollectionEndpoint(pathSegments: string[], pageToken?: string): string {
  const encodedPath = pathSegments.map(encodeURIComponent).join("/");
  const base = `https://firestore.googleapis.com/v1/projects/${firestoreProjectId}/databases/(default)/documents/${encodedPath}`;

  const params = new URLSearchParams();
  params.set("key", firestoreApiKey);
  params.set("pageSize", "200");
  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  return `${base}?${params.toString()}`;
}

// Pagina toda a colecao para garantir contagem completa, mesmo com mais de 200 documentos.
async function listAllDocuments(pathSegments: string[]): Promise<FirestoreDocument[]> {
  const allDocs: FirestoreDocument[] = [];
  let pageToken: string | undefined;

  do {
    const endpoint = getCollectionEndpoint(pathSegments, pageToken);
    const response = await fetch(endpoint, { cache: "no-store" });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Firestore list failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as FirestoreListResponse;
    allDocs.push(...(data.documents ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allDocs;
}

// Extrai o id de um documento a partir do campo name retornado pela API REST.
function getDocumentId(documentName: string): string {
  const parts = documentName.split("/");
  return parts[parts.length - 1] ?? "";
}

export async function GET() {
  try {
    if (!firestoreProjectId || !firestoreApiKey) {
      throw new Error("Firestore credentials not configured for metrics route.");
    }

    // 1) Busca todas as tarefas para contar posts recentes.
    const tasks = await listAllDocuments(["tasks"]);

    const tasksLast30Days = tasks.reduce((count, taskDoc) => {
      const createdAt = taskDoc.fields?.createdAt?.timestampValue;
      return isWithinLast30Days(createdAt) ? count + 1 : count;
    }, 0);

    let commentsLast30Days = 0;

    // 2) Para cada tarefa, soma comentarios recentes da subcolecao threads.
    for (const taskDoc of tasks) {
      const taskId = getDocumentId(taskDoc.name);
      if (!taskId) {
        continue;
      }

      const threadDocs = await listAllDocuments(["tasks", taskId, "threads"]);
      commentsLast30Days += threadDocs.reduce((count, threadDoc) => {
        const createdAt = threadDoc.fields?.createdAt?.timestampValue;
        return isWithinLast30Days(createdAt) ? count + 1 : count;
      }, 0);
    }

    return NextResponse.json({
      tasksLast30Days,
      commentsLast30Days,
    });
  } catch (error) {
    // Fallback seguro para nao quebrar a home se a agregacao falhar.
    console.error("Erro ao gerar metricas dos ultimos 30 dias:", error);
    return NextResponse.json(
      { tasksLast30Days: 0, commentsLast30Days: 0 },
      { status: 500 }
    );
  }
}
