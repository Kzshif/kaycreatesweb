import { createBot } from "./bots";
import { addLead, logConversation } from "./convos";
import { getDb } from "./db";
import type { Bot, Workspace } from "./types";

// New-workspace onboarding: create the starter bot and seed a week of sample
// activity so the dashboard, charts, and briefing are alive from first login.
// Sample rows are clearly marked so they read as examples, not fake customers.

export function onboardWorkspace(workspace: Workspace): Bot {
  const bot = createBot(workspace, {
    knowledge: workspace.about,
    faq: [
      {
        q: "What are your hours?",
        a: "We usually reply within one business day — leave your email and we'll get back to you.",
      },
    ],
  });
  seedSampleActivity(workspace, bot);
  return bot;
}

function seedSampleActivity(workspace: Workspace, bot: Bot) {
  const at = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3_600_000).toISOString();

  const visitors: [string, string, string][] = [
    ["Sample: Maya Torres", "maya@example.com", "Interested in pricing for a small business"],
    ["Sample: Devon Clarke", "devon@example.com", "Asked whether you offer rush turnaround"],
    ["Sample: Lena Fischer", "lena@example.com", "Wants a quote — mentioned a budget of ~$2k"],
  ];

  // A week of conversations with a plausible daily rhythm.
  let v = 0;
  for (let day = 6; day >= 0; day--) {
    const perDay = 1 + ((day * 5 + 2) % 3);
    for (let i = 0; i < perDay; i++) {
      const visitorId = `sample_${day}_${i}`;
      const startedAt = at(day * 24 + 3 + i * 4);
      logConversation({
        botId: bot.id,
        workspaceId: workspace.id,
        visitorId,
        transcript: [
          { role: "user", content: "Hi — do you work with businesses like mine?" },
          {
            role: "assistant",
            content: `Absolutely! ${workspace.name} would love to help. Want to tell me a bit about what you need?`,
          },
        ],
      });
      // Backdate the row (logConversation stamps "now").
      backdate(bot.id, visitorId, startedAt);
      v++;
    }
  }

  for (let i = 0; i < visitors.length; i++) {
    const [name, email, message] = visitors[i];
    addLead({
      botId: bot.id,
      workspaceId: workspace.id,
      name,
      email,
      message,
      source: bot.name,
      createdAt: at(20 + i * 30),
    });
  }
}

function backdate(botId: string, visitorId: string, iso: string) {
  getDb()
    .prepare(`UPDATE conversations SET startedAt = ?, lastMessageAt = ? WHERE botId = ? AND visitorId = ?`)
    .run(iso, iso, botId, visitorId);
}
