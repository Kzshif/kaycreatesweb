import { redirect } from "next/navigation";
import { SignupForm } from "@/components/AuthForm";
import { AuthPanel } from "@/components/AuthPanel";
import { getUser } from "@/lib/auth";

export const metadata = {
  title: "Start free trial · KayCreatesWeb",
};

export default async function SignupPage() {
  if (await getUser()) redirect("/app");
  return (
    <AuthPanel
      title="Give your website superpowers."
      subtitle="Two minutes to set up: tell us about your business and get an AI chatbot ready to embed, plus the full SEO studio."
    >
      <SignupForm />
    </AuthPanel>
  );
}
