import type Anthropic from "@anthropic-ai/sdk";

// Model selection for every AI surface. We prefer the most capable model and
// fall back down the family when the account's plan doesn't include it (the
// API returns 403/404 "model not available"). The winner is cached for the
// process lifetime. Override explicitly with CLAUDE_MODEL.

export const MODEL = "claude-opus-4-8";

const CANDIDATES = [
  process.env.CLAUDE_MODEL,
  "claude-opus-4-8",
  "claude-sonnet-5",
  "claude-haiku-4-5",
].filter((m): m is string => !!m);

const g = globalThis as unknown as { __kcwModel?: string };

export async function getModel(client: Anthropic): Promise<string> {
  if (g.__kcwModel) return g.__kcwModel;

  let lastError: unknown;
  for (const model of CANDIDATES) {
    try {
      // Cheap availability probe — counts tokens, generates nothing.
      await client.messages.countTokens({
        model,
        messages: [{ role: "user", content: "ping" }],
      });
      g.__kcwModel = model;
      return model;
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number }).status;
      // Model not on this plan / unknown model → try the next tier down.
      if (status === 403 || status === 404) continue;
      throw err; // auth errors etc. — not a model-availability problem
    }
  }
  throw lastError ?? new Error("No Claude model available for this API key");
}
