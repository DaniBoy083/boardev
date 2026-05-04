import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import {
  createThreadUseCase,
  deleteThreadUseCase,
} from "@/src/application/use-cases/boardev";
import {
  parseCreateThreadInput,
  parseDeleteThreadInput,
} from "@/src/application/validation/boardev";
import {
  isAppError,
  type ViewerIdentity,
} from "@/src/domain/boardev";
import { firebaseServerBoardevRepository } from "@/src/infrastructure/firebase/server-boardev-repository";

function getViewerFromSession(session: Session | null): ViewerIdentity | null {
  const viewerEmail = session?.user?.email?.trim();

  if (!viewerEmail) {
    return null;
  }

  return {
    email: viewerEmail,
    name: session?.user?.name?.trim() || viewerEmail || "Visitante",
  };
}

function toErrorResponse(error: unknown, fallbackLogMessage: string) {
  if (isAppError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.statusCode });
  }

  console.error(fallbackLogMessage, error);
  return NextResponse.json({ message: "Erro interno." }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const viewer = getViewerFromSession(session);

    if (!viewer) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const input = parseCreateThreadInput(body);
    await createThreadUseCase(firebaseServerBoardevRepository, viewer, input);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "Erro ao criar comentario/resposta:");
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const viewer = getViewerFromSession(session);

    if (!viewer) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const input = parseDeleteThreadInput(body);
    await deleteThreadUseCase(firebaseServerBoardevRepository, viewer, input);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "Erro ao excluir comentario/resposta:");
  }
}
