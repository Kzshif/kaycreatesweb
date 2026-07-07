import Chat from "@/components/Chat";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata = {
  title: "Live demo · nova05",
};

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ vertical?: string }>;
}) {
  const { vertical } = await searchParams;

  return (
    <>
      <SiteHeader active="demo" />
      <main className="container-x py-10">
        <div className="reveal mb-7 max-w-2xl">
          <p className="eyebrow mb-3">Live demo</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Ring the front desk.
          </h1>
          <p className="mt-3 text-slate-400">
            Pick a practice and chat exactly like you&apos;d talk to a receptionist on
            the phone. Anything Robin books or notes appears on the{" "}
            <a href="/dashboard" className="font-medium text-cyan underline-offset-2 hover:underline">
              staff dashboard
            </a>{" "}
            instantly.
          </p>
        </div>
        <Chat initialVertical={vertical} />
      </main>
      <SiteFooter />
    </>
  );
}
