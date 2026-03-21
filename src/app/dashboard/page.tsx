import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { DashboardClient } from "../../components/dashboard/dashboard-client";

// Correcao: em App Router o titulo da pagina e definido via metadata,
// nao via <Head> do next/head (que nao funciona no app/).
export const metadata = { title: "Dashboard | Boardev" };

// Pagina de dashboard exibida na rota "/dashboard".
export default async function DashboardPage() {
  // Verifica sessao no servidor — necessario para proteger a rota.
  const session = await getServerSession(authOptions);

  // Correcao: sem sessao, redireciona para login usando redirect() do next/navigation.
  if (!session) {
    redirect("/login");
  }

  return <DashboardClient sessionName={session.user?.name ?? session.user?.email ?? ""} />; {/* Renderiza o componente cliente do dashboard, passando o nome do usuario para saudacao personalizada. */}
}