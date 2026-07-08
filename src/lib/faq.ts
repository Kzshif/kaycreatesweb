// Extractable FAQ content (AEO Pattern 4). Used both for the visible FAQ section
// and the FAQPage JSON-LD, so answer engines can quote self-contained answers.
export const FAQS: { q: string; a: string }[] = [
  {
    q: "What is an AI receptionist?",
    a: "An AI receptionist is software that answers a business's phone calls and messages in natural language and handles routine front-desk tasks — booking appointments, taking messages, and answering common questions — without a human operator. nova05 is an AI receptionist built specifically for UK healthcare practices.",
  },
  {
    q: "How much does nova05 cost?",
    a: "nova05 costs £79 per month per practice on the Starter plan and £179 per month on the Practice plan, with custom pricing for multi-site groups. Founding practices — the first ten clinics — lock in £49 (Starter) or £119 (Practice) for their first 12 months. There are no setup fees and no card is needed to sign up: you register your interest, we build you a personal demo, and you only pay when you decide to go live. Cancel anytime; phone-line usage is billed separately at cost.",
  },
  {
    q: "Does nova05 build websites?",
    a: "Yes. nova05 designs and builds fast, mobile-friendly websites for UK local businesses — cafés, trades, salons, shops, and B&Bs — including menus, online booking, photo galleries, and click-and-collect ordering. Design, copywriting, and hosting are all handled for one flat price agreed upfront, and every site is ready to add the AI receptionist later.",
  },
  {
    q: "Which practices is nova05 for?",
    a: "nova05 is built for UK dental practices, private GP clinics, physiotherapy clinics, and veterinary clinics. Each sector is pre-loaded with the treatments, scheduling patterns, and questions that front desk handles.",
  },
  {
    q: "Can an AI receptionist book appointments and take messages?",
    a: "Yes. nova05 collects the caller's name, number, treatment, and preferred time to request an appointment, and it takes and prioritises messages for repeat prescriptions, billing questions, and urgent symptoms so nothing is missed.",
  },
  {
    q: "Does an AI receptionist give medical advice?",
    a: "No. nova05 never gives clinical or medical advice. Any clinical question is captured as a priority message for a registered clinician to follow up, so patient safety is never compromised.",
  },
  {
    q: "Does nova05 work 24/7?",
    a: "Yes. It answers every call day and night — including after-hours, lunch cover, and when several people call at once — so no patient ever reaches voicemail.",
  },
  {
    q: "Do I need a new phone system to use it?",
    a: "No. You simply divert your existing phone number or website chat to nova05. There is no new hardware to install and it can be live the same afternoon.",
  },
];
