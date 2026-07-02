import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AuthForm";
import { AuthPanel } from "@/components/AuthPanel";
import { getUser } from "@/lib/auth";

export const metadata = {
  title: "Sign in · FrontDesk AI",
};

export default async function LoginPage() {
  if (await getUser()) redirect("/app");
  return (
    <AuthPanel
      title="Welcome back."
      subtitle="Sign in to see everything Robin has handled while you were away."
    >
      <LoginForm />
    </AuthPanel>
  );
}
