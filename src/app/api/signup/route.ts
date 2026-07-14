import { NextResponse } from "next/server";
import { addEvent } from "@/lib/store";

// Sign-up / register-interest endpoint. No accounts, no card, no trial — it
// captures who's interested and drops them into the same dashboard queue as
// everything Robin captures, so follow-up (demo, free-trial invite) is manual
// and personal.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const s = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 500) : "");
  const name = s(body.name);
  const business = s(body.business);
  const email = s(body.email);
  const phone = s(body.phone);
  const interest = s(body.interest) || "website";
  const plan = s(body.plan);
  const message = s(body.message);

  // Honeypot: real users never fill this hidden field. Pretend success.
  if (s(body.company_url)) return NextResponse.json({ ok: true });

  if (!name || !business || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please give us your name, business name and a valid email." },
      { status: 400 },
    );
  }

  const event = await addEvent({
    kind: "signup",
    vertical: "dental", // not shown for sign-ups; the dashboard labels these "Website enquiry"
    name,
    contact: phone ? `${email} · ${phone}` : email,
    summary: `New sign-up from ${business} — interested in: ${interest}`,
    details: {
      business,
      interested: interest,
      ...(plan ? { plan } : {}),
      ...(message ? { message } : {}),
    },
  });

  return NextResponse.json({ ok: true, id: event.id });
}
