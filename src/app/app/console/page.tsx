import { redirect } from "next/navigation";
import Link from "next/link";
import StreamChat from "@/components/StreamChat";
import { getUser } from "@/lib/auth";
import { getPracticeByUser, practiceToVertical } from "@/lib/practices";

export const dynamic = "force-dynamic";

export default async function ConsolePage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const practice = getPracticeByUser(user.id);
  if (!practice) redirect("/signup");
  const vertical = practiceToVertical(practice);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">Test console</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Call your own front desk.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/60">
          This is exactly what your callers experience — Robin, configured with{" "}
          <Link href="/app/settings" className="font-medium text-teal hover:underline">
            your hours, services, and FAQs
          </Link>
          . Everything it captures lands in your{" "}
          <Link href="/app/inbox" className="font-medium text-teal hover:underline">
            inbox
          </Link>{" "}
          and counts toward your monthly conversations.
        </p>
      </div>

      <StreamChat
        endpoint="/api/chat"
        body={{ scope: "practice" }}
        greeting={vertical.greeting}
        suggestions={[
          "I'd like to book an appointment next week.",
          "What are your hours?",
          "Can you take a message for the billing team?",
          "It's kind of an emergency…",
        ]}
        placeholder="Type as if you're calling the front desk…"
        persona={{ name: `Robin · ${practice.name}`, emoji: vertical.emoji }}
      />
    </div>
  );
}
