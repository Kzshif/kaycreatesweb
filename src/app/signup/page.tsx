import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SignupForm } from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "Sign up",
  description:
    "Register your interest in a website or AI receptionist for your business. No card, no trial clock — we reply personally with a demo built for you.",
  alternates: { canonical: "/signup" },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; interest?: string }>;
}) {
  const { plan, interest } = await searchParams;
  return (
    <>
      <SiteHeader />
      <section className="container-x max-w-3xl py-16 lg:py-20">
        <p className="eyebrow mb-3">Sign up</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Tell us what you need.
          <br />
          <span className="neon">We&apos;ll build the demo first.</span>
        </h1>
        <p className="mt-4 max-w-xl text-slate-300">
          No card, no self-serve trial that expires while you&apos;re busy running the
          business. Sign up below and we&apos;ll come back within one working day with
          a demo made for <em>your</em>{" "}business — then you decide.
        </p>
        {plan && (
          <p className="mt-3 text-sm text-slate-400">
            You picked the <span className="font-semibold text-cyan">{plan}</span>{" "}
            plan — we&apos;ll include it in the demo.
          </p>
        )}
        <div className="mt-8">
          <SignupForm defaultPlan={plan} defaultInterest={interest} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
