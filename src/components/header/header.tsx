import Link from "next/link";

export function Header() {
    return (
        <header className="w-full border-b border-zinc-800 bg-zinc-950">
            <section className="mx-auto flex w-full max-w-7xl items-center justify-between px-3 py-4 sm:px-6 lg:px-8">
                <nav className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
                    >
                        Boaedev
                    </Link>
                    <Link
                        href="/dashboard"
                        className="rounded-md border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-white"
                    >
                        Dashboard
                    </Link>
                </nav>
                <Link
                    href="/login"
                    className="rounded-full border border-zinc-500 px-7 py-2 text-sm font-semibold text-white transition-colors hover:border-zinc-300 hover:bg-zinc-900"
                >
                    Acessar
                </Link>
            </section>
        </header>
    );
}