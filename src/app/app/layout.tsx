import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getUser } from "@/lib/auth";
import { planStatus } from "@/lib/billing";
import { getPracticeByUser } from "@/lib/practices";

export const metadata = {
  title: "Dashboard · FrontDesk AI",
};

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const practice = getPracticeByUser(user.id);
  if (!practice) redirect("/signup");

  const status = planStatus(practice);
  const planBadge = status.onTrial
    ? status.trialExpired
      ? "Trial ended — pick a plan"
      : `Free trial · ${status.trialDaysLeft} day${status.trialDaysLeft === 1 ? "" : "s"} left`
    : `${status.planName} plan`;

  return (
    <AppShell user={user} practice={practice} planBadge={planBadge}>
      {children}
    </AppShell>
  );
}
