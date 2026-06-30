import type { Vertical, VerticalId } from "./types";

// The "vertical" in vertical SaaS: each industry ships pre-configured with the
// language, services, and FAQs a front desk in that field actually handles.
export const VERTICALS: Record<VerticalId, Vertical> = {
  dental: {
    id: "dental",
    practice: "Brightwater Dental",
    label: "Dental clinic",
    emoji: "🦷",
    tagline: "Cleanings, crowns, and the occasional 2am toothache.",
    services: [
      "New patient exam & cleaning",
      "Routine cleaning",
      "Filling",
      "Crown consultation",
      "Teeth whitening",
      "Emergency / toothache",
    ],
    hours: "Mon–Fri 8:00am–5:00pm, Sat 9:00am–1:00pm. Closed Sunday.",
    faq: [
      {
        q: "Do you take my insurance?",
        a: "We're in-network with most major PPO plans including Delta Dental, Cigna, and MetLife. We'll verify your specific plan before the visit.",
      },
      {
        q: "How much is a cleaning without insurance?",
        a: "A standard cleaning and exam is $129 for self-pay patients. New-patient exams including X-rays are $189.",
      },
      {
        q: "I have a dental emergency.",
        a: "We hold same-day emergency slots. Take a message with the patient's name, callback number, and a quick description of the pain so the on-call dentist can triage.",
      },
    ],
    greeting:
      "Thanks for calling Brightwater Dental, this is Robin. How can I help you today?",
  },
  medical: {
    id: "medical",
    practice: "Cedar Park Family Medicine",
    label: "Family medicine",
    emoji: "🩺",
    tagline: "Annual physicals, sick visits, and refills handled.",
    services: [
      "Annual physical",
      "Sick visit",
      "Follow-up appointment",
      "Vaccination / flu shot",
      "Prescription refill request",
      "Lab results review",
    ],
    hours: "Mon–Fri 7:30am–6:00pm. Closed weekends.",
    faq: [
      {
        q: "Can I get a same-day sick visit?",
        a: "Yes, we keep same-day slots for acute illness. We'll need the patient's symptoms and how long they've had them.",
      },
      {
        q: "How do I request a refill?",
        a: "Take a message with the patient's name, date of birth, the medication, and the pharmacy. A provider reviews refill requests within one business day.",
      },
      {
        q: "Are you accepting new patients?",
        a: "We are accepting new patients on most major insurance plans. New-patient physicals book about two weeks out.",
      },
    ],
    greeting:
      "Cedar Park Family Medicine, this is Robin speaking. How can I help?",
  },
  physio: {
    id: "physio",
    practice: "Kinetic Physical Therapy",
    label: "Physical therapy",
    emoji: "🏃",
    tagline: "Rehab plans, sports injuries, and post-op recovery.",
    services: [
      "Initial evaluation",
      "Follow-up treatment",
      "Sports injury assessment",
      "Post-surgical rehab",
      "Dry needling",
      "Gait / movement screen",
    ],
    hours: "Mon–Thu 7:00am–7:00pm, Fri 7:00am–4:00pm.",
    faq: [
      {
        q: "Do I need a referral?",
        a: "Most plans allow direct access for the first few visits, but some require a physician referral for ongoing care. We'll check your plan when we book.",
      },
      {
        q: "How long is an appointment?",
        a: "Initial evaluations are about 60 minutes; follow-up treatment sessions run 45 minutes.",
      },
      {
        q: "Do you treat sports injuries?",
        a: "Yes — sprains, strains, and post-op ACL/rotator-cuff rehab are a big part of what we do.",
      },
    ],
    greeting: "Kinetic Physical Therapy, this is Robin. How can I help you?",
  },
  vet: {
    id: "vet",
    practice: "Maple Street Veterinary",
    label: "Veterinary clinic",
    emoji: "🐾",
    tagline: "Wellness exams, vaccines, and worried pet parents.",
    services: [
      "Wellness exam",
      "Vaccination",
      "Sick pet visit",
      "Dental cleaning",
      "Spay / neuter consult",
      "Emergency",
    ],
    hours: "Mon–Fri 8:00am–6:00pm, Sat 9:00am–2:00pm.",
    faq: [
      {
        q: "My pet is an emergency.",
        a: "Take a message immediately with the owner's name, callback number, the pet's species, and the symptoms so a vet tech can call back to triage. For after-hours, refer to Regional Pet ER.",
      },
      {
        q: "When are vaccines due?",
        a: "Puppies and kittens need a vaccine series; adults are typically annual or every three years depending on the vaccine. We'll confirm from the chart.",
      },
      {
        q: "Do you see exotics?",
        a: "We see dogs, cats, and small mammals (rabbits, guinea pigs). We refer reptiles and birds to a specialty exotics clinic.",
      },
    ],
    greeting: "Maple Street Veterinary, this is Robin. How can I help today?",
  },
};

export const VERTICAL_LIST: Vertical[] = Object.values(VERTICALS);

export function getVertical(id: string | null | undefined): Vertical {
  if (id && id in VERTICALS) return VERTICALS[id as VerticalId];
  return VERTICALS.dental;
}
