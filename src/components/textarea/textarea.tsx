import { TextareaHTMLAttributes } from "react";

// Componente reutilizavel de textarea com estilizacao padrao do projeto.
export function Textarea({ ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="w-full resize-none rounded-md border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
      rows={4}
      {...rest}
    />
  );
}