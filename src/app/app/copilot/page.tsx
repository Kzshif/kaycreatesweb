import { redirect } from "next/navigation";
import StreamChat from "@/components/StreamChat";
import { getUser } from "@/lib/auth";
import { getPracticeByUser } from "@/lib/practices";

export const dynamic = "force-dynamic";

export default async function CopilotPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const practice = getPracticeByUser(user.id);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">Copilot</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Ask anything about your front desk.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/60">
          The Copilot reads your live data — every booking, message, and callback Robin captured —
          and answers with names, numbers, and next steps.
        </p>
      </div>

      <StreamChat
        endpoint="/api/copilot"
        greeting={`Hi! I'm your front-desk Copilot for ${practice?.name ?? "your practice"}. Ask me what happened today, who to call back first, or what's trending — I'll pull the answer straight from your data.`}
        suggestions={[
          "What happened today?",
          "Who should I call back first?",
          "Any upset callers this week?",
          "What do people call about the most?",
        ]}
        placeholder="Ask about your calls, bookings, and messages…"
        persona={{ name: "Copilot", emoji: "✦" }}
      />
    </div>
  );
}
