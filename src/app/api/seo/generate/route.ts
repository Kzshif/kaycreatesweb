import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { MODEL } from "@/lib/ai";
import { tenantFromRequest } from "@/lib/tenant";
import type { StreamEvent, Workspace } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// AI content generation for the SEO studio.
//   kind "meta": JSON — title, description, keywords for a topic/page.
//   kind "post": streaming NDJSON — a full SEO-optimized blog post.

export async function POST(req: NextRequest) {
  const tenant = tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { kind?: string; topic?: string; keywords?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const topic = (body.topic ?? "").trim().slice(0, 300);
  const keywords = (body.keywords ?? "").trim().slice(0, 300);
  if (!topic) return NextResponse.json({ error: "Tell us what the page or post is about." }, { status: 400 });

  if (body.kind === "post") return generatePost(tenant.workspace, topic, keywords);
  return generateMeta(tenant.workspace, topic, keywords);
}

// --- Meta tags & keywords (JSON) ----------------------------------------------

async function generateMeta(workspace: Workspace, topic: string, keywords: string) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ result: fallbackMeta(workspace, topic, keywords), mode: "fallback" });
  }
  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: `You are an SEO copywriter for ${workspace.name}${
            workspace.about ? ` (${workspace.about.slice(0, 250)})` : ""
          }.

Write optimized metadata for a page about: "${topic}"${keywords ? `\nTarget keywords: ${keywords}` : ""}

Reply as strict JSON, no markdown:
{"title": "<30-60 chars, keyword near the front, compelling>",
 "description": "<70-155 chars, sells the click, includes the main keyword naturally>",
 "keywords": ["<8-12 keyword phrases, mix of head terms and long-tail>"],
 "h1": "<a strong page H1, different wording than the title>"}`,
        },
      ],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return NextResponse.json({ result: parsed, mode: "live" });
  } catch {
    return NextResponse.json({ result: fallbackMeta(workspace, topic, keywords), mode: "fallback" });
  }
}

function fallbackMeta(workspace: Workspace, topic: string, keywords: string) {
  const cap = topic.charAt(0).toUpperCase() + topic.slice(1);
  const kw = keywords
    ? keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [topic.toLowerCase(), `${topic.toLowerCase()} near me`, `best ${topic.toLowerCase()}`];
  return {
    title: `${cap} | ${workspace.name}`.slice(0, 60),
    description: `Looking for ${topic.toLowerCase()}? ${workspace.name} can help — get in touch today and see why customers choose us.`.slice(0, 155),
    keywords: kw.slice(0, 12),
    h1: cap,
  };
}

// --- Blog post (streaming NDJSON) -----------------------------------------------

function send(controller: ReadableStreamDefaultController, enc: TextEncoder, e: StreamEvent) {
  controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
}

async function generatePost(workspace: Workspace, topic: string, keywords: string) {
  const enc = new TextEncoder();
  const hasKey = !!process.env.ANTHROPIC_API_KEY;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!hasKey) {
          const words = fallbackPost(workspace, topic).split(" ");
          for (let i = 0; i < words.length; i++) {
            send(controller, enc, { type: "text", text: (i === 0 ? "" : " ") + words[i] });
            await new Promise((r) => setTimeout(r, 6));
          }
          send(controller, enc, { type: "done", mode: "fallback" });
        } else {
          const client = new Anthropic();
          const ms = client.messages.stream({
            model: MODEL,
            max_tokens: 3000,
            messages: [
              {
                role: "user",
                content: `You are the content writer for ${workspace.name}${
                  workspace.about ? ` (${workspace.about.slice(0, 250)})` : ""
                }.

Write an SEO-optimized blog post about: "${topic}"${keywords ? `\nWork these keywords in naturally: ${keywords}` : ""}

Format as markdown: an H1 title, a hook intro, 3-5 H2 sections with practical substance, and a short conclusion with a call to action for ${workspace.name}. 600-900 words. Write like a knowledgeable human, not a brochure — specific, useful, zero filler phrases like "in today's fast-paced world".`,
              },
            ],
          });
          ms.on("text", (delta) => send(controller, enc, { type: "text", text: delta }));
          await ms.finalMessage();
          send(controller, enc, { type: "done", mode: "live" });
        }
      } catch (err) {
        send(controller, enc, {
          type: "error",
          message: err instanceof Error ? err.message : "Generation failed",
        });
        send(controller, enc, { type: "done", mode: hasKey ? "live" : "fallback" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

function fallbackPost(workspace: Workspace, topic: string): string {
  const cap = topic.charAt(0).toUpperCase() + topic.slice(1);
  return `# ${cap}: A Practical Guide

*(Demo draft — add an ANTHROPIC_API_KEY to generate full, original posts written for your business.)*

## Why ${topic.toLowerCase()} matters

Customers searching for ${topic.toLowerCase()} are already close to a decision. A clear, helpful page that answers their real questions is what turns that search into a call.

## What to cover

- What it costs and what affects the price
- How the process works, step by step
- What makes ${workspace.name} different
- Answers to the questions you hear every week

## Next steps

End with one clear call to action: invite the reader to reach out to ${workspace.name} — and let your website chatbot capture the lead the moment they do.`;
}
