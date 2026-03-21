"use client"; // Indica que este componente deve ser renderizado no cliente, pois utiliza hooks de estado e sessão do NextAuth.
// Componente de cabecalho global com links principais de navegacao.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export function Header() {
    const { data: session, status } = useSession();
    // Detecta a rota atual para esconder o botao "Acessar" na pagina de login.
    const pathname = usePathname();

    // Renderiza a barra superior em tema preto/branco.
    return (
        <header className="w-full border-b border-zinc-800 bg-zinc-950">
            <section className="mx-auto flex w-full max-w-7xl items-center justify-between px-3 py-4 sm:px-6 lg:px-8">
                {/* Navegacao principal da aplicacao */}
                <nav className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
                    >
                        Boaedev
                    </Link>
                    {session?.user && (
                        <Link
                            href="/dashboard"
                            className="rounded-md border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-white"
                        >
                            Dashboard
                        </Link>
                    )}
                </nav>
                {/* Area de autenticacao - mostra login ou logout com base no status da sessao */}
                {status === "loading" ? (
                    <p className="text-sm text-zinc-500">Carregando...</p>
                ) : session ? (
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Nome oculto em telas pequenas para evitar overflow */}
                        <span className="hidden text-sm text-zinc-300 sm:inline">
                            Ola, {session.user?.name?.split(" ")[0]}
                        </span>
                        <button
                            onClick={() => signOut()}
                            className="rounded-full border border-zinc-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:border-zinc-300 hover:bg-zinc-900 sm:px-7 sm:py-2"
                        >
                            Sair
                        </button>
                    </div>
                ) : (
                    // Botao visivel em qualquer rota exceto "/login"
                    pathname !== "/login" && (
                        <Link
                            href="/login"
                            className="rounded-full border border-zinc-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:border-zinc-300 hover:bg-zinc-900 sm:px-7 sm:py-2"
                        >
                            Acessar
                        </Link>
                    )
                )}
            </section>
        </header>
    );
}