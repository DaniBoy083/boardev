import {
  AppError,
  TASK_TEXT_MAX_LENGTH,
  THREAD_MESSAGE_MAX_LENGTH,
  type CreateTaskInput,
  type CreateThreadInput,
  type DeleteThreadInput,
} from "@/src/domain/boardev";

function ensureObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(400, "Dados invalidos.");
  }

  return value as Record<string, unknown>;
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function readOptionalString(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(400, "Dados invalidos.");
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

export function validateIdentifier(value: string, message: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new AppError(400, message);
  }

  return normalizedValue;
}

export function validateTaskText(value: string): string {
  const task = readNonEmptyString(value);

  if (!task) {
    throw new AppError(400, "Por favor, digite uma tarefa.");
  }

  if (task.length > TASK_TEXT_MAX_LENGTH) {
    throw new AppError(
      400,
      `A tarefa pode ter no maximo ${TASK_TEXT_MAX_LENGTH} caracteres.`,
    );
  }

  return task;
}

export function validateThreadMessage(value: string): string {
  const message = readNonEmptyString(value);

  if (!message) {
    throw new AppError(400, "Dados invalidos.");
  }

  if (message.length > THREAD_MESSAGE_MAX_LENGTH) {
    throw new AppError(
      400,
      `O comentario pode ter no maximo ${THREAD_MESSAGE_MAX_LENGTH} caracteres.`,
    );
  }

  return message;
}

export function validateTaskInput(input: CreateTaskInput): CreateTaskInput {
  const email = validateIdentifier(
    input.email,
    "Sessao invalida. Faca login novamente para salvar tarefas.",
  );

  return {
    task: validateTaskText(input.task),
    user: input.user.trim(),
    email,
    isPublic: input.isPublic,
  };
}

export function parseCreateThreadInput(body: unknown): CreateThreadInput {
  const data = ensureObject(body);
  const taskId = readNonEmptyString(data.taskId);
  const message = readNonEmptyString(data.message);
  const parentId = readOptionalString(data.parentId);

  if (!taskId || !message) {
    throw new AppError(400, "Dados invalidos.");
  }

  return {
    taskId: validateIdentifier(taskId, "Dados invalidos."),
    message: validateThreadMessage(message),
    parentId,
  };
}

export function parseDeleteThreadInput(body: unknown): DeleteThreadInput {
  const data = ensureObject(body);
  const taskId = readNonEmptyString(data.taskId);
  const commentId = readNonEmptyString(data.commentId);

  if (!taskId || !commentId) {
    throw new AppError(400, "Dados invalidos.");
  }

  return {
    taskId: validateIdentifier(taskId, "Dados invalidos."),
    commentId: validateIdentifier(commentId, "Dados invalidos."),
  };
}