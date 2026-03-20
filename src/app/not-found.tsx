import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-152px)] w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center text-white">
      <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Erro 404</p>
      <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Pagina nao encontrada</h1>
      <p className="mt-4 max-w-xl text-zinc-300">
        A rota que voce tentou acessar nao existe ou foi movida.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md border border-white bg-white px-5 py-2 font-semibold text-black transition hover:bg-zinc-200"
      >
        Voltar para a Home
      </Link>
    </section>
  );
}
