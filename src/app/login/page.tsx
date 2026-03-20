export default function LoginPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-152px)] w-full max-w-md flex-col justify-center px-4 py-12 text-white">
      <h1 className="text-3xl font-bold sm:text-4xl">Acessar</h1>
      <p className="mt-2 text-zinc-300">Entre com sua conta para continuar.</p>

      <form className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm text-zinc-200">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="voce@exemplo.com"
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-white"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm text-zinc-200">
            Senha
          </label>
          <input
            id="password"
            type="password"
            placeholder="Sua senha"
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none transition focus:border-white"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md border border-white bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200"
        >
          Entrar
        </button>
      </form>
    </section>
  );
}
