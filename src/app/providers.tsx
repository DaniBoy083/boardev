"use client";

// SessionProvider precisa rodar no cliente (usa context do React)
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Envolve toda a aplicação com o SessionProvider do NextAuth,
  // tornando a sessão do usuário acessível via useSession() em qualquer Client Component
  return (
    <SessionProvider>
      {children}
      {/* Container global para exibir toasts em qualquer tela */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#18181b",
            color: "#fff",
            border: "1px solid #3f3f46",
          },
        }}
      />
    </SessionProvider>
  );
}
