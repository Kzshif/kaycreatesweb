import { NextRequest } from "next/server";
import { getVertical } from "@/lib/verticals";
import { converse } from "@/lib/converse";
import {
  endCall,
  gather,
  getTranscript,
  hangup,
  parseTwilioForm,
  publicUrl,
  setTranscript,
  twiml,
  twimlResponse,
  validateSignature,
} from "@/lib/twilio";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOODBYE = /\b(bye|goodbye|that'?s all|nothing else|no that'?s it|hang up|we'?re done)\b/i;

// Twilio posts the caller's transcribed speech here. We run the receptionist,
// speak the reply, and listen again — or hang up when the caller is done.
export async function POST(req: NextRequest) {
  const vertical = getVertical(req.nextUrl.searchParams.get("vertical"));
  const params = await parseTwilioForm(req);
  const url = publicUrl(req, req.nextUrl.pathname + req.nextUrl.search);
  if (!validateSignature(url, params, req.headers.get("x-twilio-signature"))) {
    return new Response("Invalid signature", { status: 403 });
  }

  const callSid = params.CallSid || "unknown";
  const speech = (params.SpeechResult || "").trim();
  const action = `/api/voice/respond?vertical=${vertical.id}`;

  // No speech captured — re-prompt once.
  if (!speech) {
    return twimlResponse(
      twiml(gather("Sorry, I didn't catch that. How can I help you?", action)),
    );
  }

  const history: ChatMessage[] = [...getTranscript(callSid), { role: "user", content: speech }];

  const { text } = await converse(history, vertical);

  const updated: ChatMessage[] = [...history, { role: "assistant", content: text }];
  setTranscript(callSid, updated);

  // If the caller signalled they're done, say the reply and hang up.
  if (GOODBYE.test(speech)) {
    endCall(callSid);
    return twimlResponse(twiml(hangup(text + " Take care, goodbye.")));
  }

  return twimlResponse(twiml(gather(text, action)));
}
