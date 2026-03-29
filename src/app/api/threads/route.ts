import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Timestamp } from "firebase-admin/firestore";
import { authOptions } from "../auth/[...nextauth]/route";
import { getAdminDb } from "../../services/firebaseAdmin";

type ThreadDocument = {
  parentId?: string | null;
  authorEmail?: string | null;
  isPublic?: boolean;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const viewerEmail = session?.user?.email?.trim();
    const viewerName = session?.user?.name?.trim() || viewerEmail || "Visitante";

    if (!viewerEmail) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      taskId?: string;
      message?: string;
      parentId?: string | null;
    };

    const taskId = body.taskId?.trim();
    const message = body.message?.trim();
    const parentId = body.parentId?.trim() || null;

    if (!taskId || !message) {
      return NextResponse.json({ message: "Dados invalidos." }, { status: 400 });
    }

    const db = getAdminDb();
    const taskRef = db.collection("tasks").doc(taskId);
    const taskSnapshot = await taskRef.get();

    if (!taskSnapshot.exists) {
      return NextResponse.json({ message: "Tarefa nao encontrada." }, { status: 404 });
    }

    const taskData = taskSnapshot.data() as ThreadDocument | undefined;
    if (!taskData?.isPublic) {
      return NextResponse.json({ message: "Tarefa privada." }, { status: 403 });
    }

    if (parentId) {
      const parentRef = taskRef.collection("threads").doc(parentId);
      const parentSnapshot = await parentRef.get();

      if (!parentSnapshot.exists) {
        return NextResponse.json({ message: "Comentario pai nao encontrado." }, { status: 404 });
      }

      const parentData = parentSnapshot.data() as ThreadDocument | undefined;
      if (typeof parentData?.parentId === "string" && parentData.parentId.length > 0) {
        return NextResponse.json(
          { message: "Apenas um nivel de resposta e permitido." },
          { status: 400 }
        );
      }
    }

    await taskRef.collection("threads").add({
      message,
      authorName: viewerName,
      authorEmail: viewerEmail,
      parentId,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao criar comentario/resposta:", error);
    return NextResponse.json({ message: "Erro interno." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const viewerEmail = session?.user?.email?.trim();

    if (!viewerEmail) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      taskId?: string;
      commentId?: string;
    };

    const taskId = body.taskId?.trim();
    const commentId = body.commentId?.trim();

    if (!taskId || !commentId) {
      return NextResponse.json({ message: "Dados invalidos." }, { status: 400 });
    }

    const db = getAdminDb();
    const taskRef = db.collection("tasks").doc(taskId);
    const targetRef = taskRef.collection("threads").doc(commentId);
    const targetSnapshot = await targetRef.get();

    if (!targetSnapshot.exists) {
      return NextResponse.json({ message: "Comentario nao encontrado." }, { status: 404 });
    }

    const targetData = targetSnapshot.data() as ThreadDocument | undefined;
    if (targetData?.authorEmail !== viewerEmail) {
      return NextResponse.json(
        { message: "Voce so pode excluir seus proprios comentarios." },
        { status: 403 }
      );
    }

    const batch = db.batch();
    batch.delete(targetRef);

    if (!targetData?.parentId) {
      const repliesSnapshot = await taskRef
        .collection("threads")
        .where("parentId", "==", commentId)
        .get();

      const hasForeignReplies = repliesSnapshot.docs.some(
        (replyDoc) => (replyDoc.data() as ThreadDocument).authorEmail !== viewerEmail
      );

      if (hasForeignReplies) {
        return NextResponse.json(
          { message: "Nao e possivel excluir a thread com respostas de outros usuarios." },
          { status: 403 }
        );
      }

      for (const replyDoc of repliesSnapshot.docs) {
        batch.delete(replyDoc.ref);
      }
    }

    await batch.commit();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir comentario/resposta:", error);
    return NextResponse.json({ message: "Erro interno." }, { status: 500 });
  }
}
