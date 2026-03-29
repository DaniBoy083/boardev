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

  const sessionName = session.user?.name ?? session.user?.email ?? ""; // Usa nome ou email como identificador minimo da sessao.
  const userEmail = session.user?.email ?? ""; // Armazena email do usuario para associar as tarefas criadas, garantindo que cada tarefa seja vinculada a um usuario especifico.

  // Se a sessao estiver anomala (sem identificador minimo), volta ao login.
  if (!sessionName) {
    redirect("/login");
  }

  return <DashboardClient sessionName={sessionName} userEmail={userEmail} />;
}