import { NextRequest } from "next/server";
import { getVertical } from "@/lib/verticals";
import {
  gather,
  parseTwilioForm,
  publicUrl,
  setTranscript,
  twiml,
  twimlResponse,
  validateSignature,
} from "@/lib/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Twilio Voice webhook entry point. Point a Twilio number's "A call comes in"
// webhook at  POST {your-domain}/api/voice?vertical=dental
// Robin greets the caller, then listens and forwards speech to /api/voice/respond.
export async function POST(req: NextRequest) {
  const verticalId = req.nextUrl.searchParams.get("vertical") || "dental";
  const vertical = getVertical(verticalId);

  const params = await parseTwilioForm(req);
  const url = publicUrl(req, req.nextUrl.pathname + req.nextUrl.search);
  if (!validateSignature(url, params, req.headers.get("x-twilio-signature"))) {
    return new Response("Invalid signature", { status: 403 });
  }

  const callSid = params.CallSid || `web_${Date.now()}`;

  // Seed the transcript with Robin's greeting (also spoken below).
  setTranscript(callSid, [{ role: "assistant", content: vertical.greeting }]);

  const action = `/api/voice/respond?vertical=${vertical.id}`;
  return twimlResponse(twiml(gather(vertical.greeting, action)));
}
