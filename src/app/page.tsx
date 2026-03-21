// Componente da pagina inicial (rota "/").
import Image from "next/image";

export default function Home() {
  // Exibe destaque visual com imagem hero e contadores resumidos.
  return (
    <div className="w-full bg-black text-white">
      <main className="mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6">
        {/* Bloco da imagem principal */}
        <div className="flex w-full justify-center">
          <Image
            className="h-auto w-full max-w-157.5"
            alt="Logo Tarefas+"
            src="/assets/hero.png"
            width={630}
            height={420}
            priority
          />
        </div>
        {/* Titulo principal — sem <br> para nao quebrar o layout em mobile */}
        <h1 className="mt-8 text-center text-2xl font-semibold leading-tight sm:text-4xl">
          Sistema feito para voce organizar seus estudos e tarefas
        </h1>
        {/* Cards de metricas/estatisticas */}
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <section className="rounded-md border border-white bg-white px-5 py-3">
            <span className="font-semibold text-black">+12 posts</span>
          </section>
          <section className="rounded-md border border-white bg-white px-5 py-3">
            <span className="font-semibold text-black">+90 comentarios</span>
          </section>
        </div>
      </main>
    </div>
  );
}
