// Tipagem da metadata nativa do Next.js.
import type { Metadata } from "next";
// Fontes otimizadas via next/font.
import { Geist, Geist_Mono } from "next/font/google";
// Componentes globais de estrutura.
import { Footer } from "@/src/components/footer/footer";
import { Header } from "@/src/components/header/header";
// Provider global para sessao/autenticacao.
import Providers from "./providers";
// Estilos globais da aplicacao.
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadados padrao compartilhados por toda a aplicacao.
export const metadata: Metadata = {
  title: "Boardev",
  description: "Plataforma para organizar estudos e tarefas.",
  icons: {
    icon: "/assets/favicon.png",
    shortcut: "/assets/favicon.png",
    apple: "/assets/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Layout principal: html/base + providers + header/footer globais.
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        <Providers>
          {/* Cabecalho visivel em todas as paginas */}
          <Header />
          {/* Conteudo da rota ativa */}
          <main className="flex-1">{children}</main>
          {/* Rodape visivel em todas as paginas */}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
