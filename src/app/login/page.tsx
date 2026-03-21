"use client";
// Pagina de login na rota "/login".
// Usa signIn do NextAuth para autenticar com Google.
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    // Layout centralizado, altura minima descontando header e footer
    <main className="mx-auto flex min-h-[calc(100vh-152px)] w-full max-w-sm flex-col items-center justify-center px-4 py-12 sm:px-0">
      {/* Card de login */}
      <section className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-8 sm:px-8">
        <h1 className="text-center text-xl font-bold text-white sm:text-2xl">
          Entrar no Boardev
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Use sua conta Google para acessar o painel
        </p>

        {/* Botao de login com Google */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 active:bg-zinc-600"
        >
          {/* Icone do Google em SVG para nao depender de biblioteca externa */}
          <svg
            className="h-5 w-5 shrink-0"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M43.6 20.5H42V20H24v8h11.3C33.65 32.6 29.3 36 24 36c-6.63 0-12-5.37-12-12s5.37-12 12-12c3.06 0 5.84 1.16 7.95 3.05L37.5 9.5C34.1 6.38 29.3 4.5 24 4.5 12.68 4.5 3.5 13.68 3.5 25S12.68 45.5 24 45.5c10.5 0 19.5-8 19.5-19.5 0-1.73-.18-3.04-.4-5.5z"
              fill="#FFC107"
            />
            <path
              d="M6.3 15.04l6.57 4.82C14.46 17 19.02 14 24 14c3.06 0 5.84 1.16 7.95 3.05L37.5 11.5C34.1 8.38 29.3 6 24 6 16.2 6 9.4 9.6 6.3 15.04z"
              fill="#FF3D00"
            />
            <path
              d="M24 46c5.17 0 9.87-1.8 13.48-4.75l-6.23-5.27C29.3 37.8 26.75 38.5 24 38.5c-5.28 0-9.6-3.37-11.27-8.02l-6.52 5.03C9.28 41.84 16.12 46 24 46z"
              fill="#4CAF50"
            />
            <path
              d="M43.6 20.5H42V20H24v8h11.3a12.06 12.06 0 01-4.08 5.48l6.23 5.27C37.1 38.46 43.5 33 43.5 25c0-1.73-.18-3.04-.4-5.5z"
              fill="#1976D2"
            />
          </svg>
          Continuar com Google
        </button>
      </section>
    </main>
  );
}
