import { describe, expect, it } from "vitest";
import {
  AppError,
  TASK_TEXT_MAX_LENGTH,
  THREAD_MESSAGE_MAX_LENGTH,
} from "@/src/domain/boardev";
import {
  parseCreateThreadInput,
  parseDeleteThreadInput,
  validateTaskInput,
  validateThreadMessage,
} from "@/src/application/validation/boardev";

describe("application/validation/boardev", () => {
  it("normaliza o input valido de tarefa", () => {
    const input = validateTaskInput({
      task: "  Organizar estudos  ",
      user: " Daniel Costa ",
      email: " daniel@example.com ",
      isPublic: true,
    });

    expect(input).toEqual({
      task: "Organizar estudos",
      user: "Daniel Costa",
      email: "daniel@example.com",
      isPublic: true,
    });
  });

  it("rejeita tarefa acima do limite", () => {
    expect(() =>
      validateTaskInput({
        task: "x".repeat(TASK_TEXT_MAX_LENGTH + 1),
        user: "Daniel",
        email: "daniel@example.com",
        isPublic: false,
      })
    ).toThrowError(AppError);
  });

  it("normaliza o payload valido de criacao de comentario", () => {
    const payload = parseCreateThreadInput({
      taskId: "  task-1 ",
      message: "  Primeira resposta ",
      parentId: " parent-1 ",
    });

    expect(payload).toEqual({
      taskId: "task-1",
      message: "Primeira resposta",
      parentId: "parent-1",
    });
  });

  it("rejeita comentario acima do limite", () => {
    expect(() => validateThreadMessage("x".repeat(THREAD_MESSAGE_MAX_LENGTH + 1))).toThrowError(
      AppError
    );
  });

  it("rejeita payload invalido de exclusao de comentario", () => {
    expect(() => parseDeleteThreadInput({ taskId: "", commentId: null })).toThrowError(
      AppError
    );
  });
});