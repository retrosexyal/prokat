import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Личный кабинет</h1>
      <div className="text-sm text-muted">
        {session?.user?.email ? `Вы вошли как ${session.user.email}` : "Вы вошли."}
      </div>
      <LogoutButton />
    </div>
  );
}

