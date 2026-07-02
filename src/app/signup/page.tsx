import { redirect } from "next/navigation";
import { SignupForm } from "@/components/AuthForm";
import { AuthPanel } from "@/components/AuthPanel";
import { getUser } from "@/lib/auth";

export const metadata = {
  title: "Start free trial · FrontDesk AI",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  if (await getUser()) redirect("/app");
  const { plan } = await searchParams;
  return (
    <AuthPanel
      title="Hire Robin in two minutes."
      subtitle="Create your account, pick your specialty, and your AI receptionist starts answering immediately — configured for your practice."
    >
      <SignupForm initialPlan={plan} />
    </AuthPanel>
  );
}
