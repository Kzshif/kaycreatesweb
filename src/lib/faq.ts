// Extractable FAQ content (AEO Pattern 4). Used both for the visible FAQ section
// and the FAQPage JSON-LD, so answer engines can quote self-contained answers.
export const FAQS: { q: string; a: string }[] = [
  {
    q: "What is an AI receptionist?",
    a: "An AI receptionist is software that answers a business's phone calls and messages in natural language and handles routine front-desk tasks — booking appointments, taking messages, and answering common questions — without a human operator. kaycreatesweb is an AI receptionist built specifically for UK healthcare practices.",
  },
  {
    q: "How much does kaycreatesweb cost?",
    a: "kaycreatesweb starts at £29 per month per practice on the Starter plan, £79 per month on the Practice plan, with custom pricing for multi-site groups. There are no setup fees and you can cancel anytime. Phone-line usage is billed separately at cost.",
  },
  {
    q: "Which practices is kaycreatesweb for?",
    a: "kaycreatesweb is built for UK dental practices, private GP clinics, physiotherapy clinics, and veterinary clinics. Each sector is pre-loaded with the treatments, scheduling patterns, and questions that front desk handles.",
  },
  {
    q: "Can an AI receptionist book appointments and take messages?",
    a: "Yes. kaycreatesweb collects the caller's name, number, treatment, and preferred time to request an appointment, and it takes and prioritises messages for repeat prescriptions, billing questions, and urgent symptoms so nothing is missed.",
  },
  {
    q: "Does an AI receptionist give medical advice?",
    a: "No. kaycreatesweb never gives clinical or medical advice. Any clinical question is captured as a priority message for a registered clinician to follow up, so patient safety is never compromised.",
  },
  {
    q: "Does kaycreatesweb work 24/7?",
    a: "Yes. It answers every call day and night — including after-hours, lunch cover, and when several people call at once — so no patient ever reaches voicemail.",
  },
  {
    q: "Do I need a new phone system to use it?",
    a: "No. You simply divert your existing phone number or website chat to kaycreatesweb. There is no new hardware to install and it can be live the same afternoon.",
  },
];
