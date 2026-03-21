// Route Handler do NextAuth para o App Router do Next.js.
// Deve ficar em /api/auth/[...nextauth]/route.ts e exportar GET e POST.
import NextAuth from "next-auth";

// Importa o provedor de autenticação do Google (OAuth 2.0)
import GoogleProvider from "next-auth/providers/google";

// Configurações da autenticação exportadas para uso em outros lugares
// (ex.: getServerSession em Server Components)
export const authOptions = {
  providers: [
    // Configura o login com conta Google usando as credenciais do projeto
    // definidas nas variáveis de ambiente (.env.local)
    GoogleProvider({
      // ID do cliente OAuth obtido no Google Cloud Console
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      // Segredo do cliente OAuth obtido no Google Cloud Console
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  // Segredo usado para assinar e verificar os tokens JWT da sessão
  secret: process.env.JWT_SECRET as string,
};

// No App Router, o handler deve ser exportado como GET e POST nomeados
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
