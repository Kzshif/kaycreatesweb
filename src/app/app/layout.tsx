import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getUser } from "@/lib/auth";
import { planStatus } from "@/lib/billing";
import { getWorkspaceByUser } from "@/lib/workspaces";

export const metadata = {
  title: "Dashboard · NOVA05",
};

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const workspace = await getWorkspaceByUser(user.id);
  if (!workspace) redirect("/signup");

  const status = await planStatus(workspace);
  const planBadge = status.onTrial
    ? status.trialExpired
      ? "Trial ended — pick a plan"
      : `Free trial · ${status.trialDaysLeft} day${status.trialDaysLeft === 1 ? "" : "s"} left`
    : `${status.planName} plan`;

  return (
    <AppShell user={user} workspace={workspace} planBadge={planBadge}>
      {children}
    </AppShell>
  );
}
