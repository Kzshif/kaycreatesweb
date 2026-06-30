import type { Vertical, VerticalId } from "./types";

// The "vertical" in vertical SaaS: each sector ships pre-configured with the
// language, treatments, and FAQs a UK front desk in that field actually handles.
// Example practices are Newbury / West Berkshire flavoured.
export const VERTICALS: Record<VerticalId, Vertical> = {
  dental: {
    id: "dental",
    practice: "Newbury Dental Studio",
    label: "Dental practice",
    emoji: "🦷",
    tagline: "Check-ups, crowns, and the occasional 2am toothache.",
    services: [
      "New patient exam",
      "Check-up & scale and polish",
      "Hygienist appointment",
      "Filling",
      "Crown consultation",
      "Teeth whitening",
      "Emergency / toothache",
    ],
    hours: "Mon–Fri 8:30am–5:30pm, Sat 9:00am–1:00pm. Closed Sunday.",
    faq: [
      {
        q: "Are you taking on NHS patients?",
        a: "We have a short NHS waiting list and are taking private patients now. We also offer Denplan membership. We'll note your preference when booking.",
      },
      {
        q: "How much is a check-up?",
        a: "A private check-up with a scale and polish is £65, and a new-patient exam including X-rays is £89. NHS Band 1 is charged at the standard NHS rate.",
      },
      {
        q: "I have a dental emergency.",
        a: "We hold same-day emergency slots. Take a message with the patient's name, callback number, and a quick description of the pain so the duty dentist can triage.",
      },
    ],
    greeting:
      "Thanks for calling Newbury Dental Studio, you're through to Robin. How can I help today?",
  },
  medical: {
    id: "medical",
    practice: "Kennet Private GP",
    label: "Private GP clinic",
    emoji: "🩺",
    tagline: "Same-day GP appointments, medicals, and prescriptions.",
    services: [
      "Private GP appointment",
      "Same-day sick visit",
      "Health screen / medical",
      "Travel vaccination",
      "Repeat prescription request",
      "Blood test / results review",
    ],
    hours: "Mon–Fri 8:00am–6:30pm, Sat 9:00am–12:00pm.",
    faq: [
      {
        q: "How much is a private GP appointment?",
        a: "A standard 20-minute private GP consultation is £95. Longer appointments and medicals are quoted when you book.",
      },
      {
        q: "Can I get a same-day appointment?",
        a: "Yes, we keep same-day slots. We'll take the patient's symptoms and how long they've had them so we can book the right length of appointment.",
      },
      {
        q: "How do I request a repeat prescription?",
        a: "Take a message with the patient's name, date of birth, the medication, and the pharmacy. A GP reviews requests within one working day.",
      },
    ],
    greeting: "Kennet Private GP, you're speaking with Robin. How can I help?",
  },
  physio: {
    id: "physio",
    practice: "Thatcham Physiotherapy",
    label: "Physiotherapy",
    emoji: "🏃",
    tagline: "Rehab plans, sports injuries, and post-op recovery.",
    services: [
      "Initial assessment",
      "Follow-up treatment",
      "Sports injury assessment",
      "Post-surgery rehab",
      "Acupuncture / dry needling",
      "Gait / movement screen",
    ],
    hours: "Mon–Thu 7:30am–7:00pm, Fri 7:30am–4:00pm.",
    faq: [
      {
        q: "Do I need a GP referral?",
        a: "No referral is needed to book privately. If you're claiming on private medical insurance, your insurer may ask for one — we'll check when we book.",
      },
      {
        q: "How long is an appointment?",
        a: "Initial assessments are about 45–60 minutes; follow-up treatment sessions run 30–40 minutes.",
      },
      {
        q: "Do you treat sports injuries?",
        a: "Yes — sprains, strains, and post-op ACL and rotator-cuff rehab are a big part of what we do.",
      },
    ],
    greeting: "Thatcham Physiotherapy, this is Robin. How can I help you?",
  },
  vet: {
    id: "vet",
    practice: "Wharf Veterinary Clinic",
    label: "Veterinary clinic",
    emoji: "🐾",
    tagline: "Health checks, vaccinations, and worried pet owners.",
    services: [
      "Health check",
      "Vaccination / booster",
      "Poorly pet appointment",
      "Dental treatment",
      "Neutering consultation",
      "Emergency",
    ],
    hours: "Mon–Fri 8:30am–6:30pm, Sat 9:00am–2:00pm.",
    faq: [
      {
        q: "My pet is an emergency.",
        a: "Take a message immediately with the owner's name, callback number, the pet's species, and the symptoms so a vet nurse can ring back to triage. Out of hours, refer to the Vets Now emergency service.",
      },
      {
        q: "When are vaccinations due?",
        a: "Puppies and kittens need a vaccination course; adults are typically an annual booster. We'll confirm from the records.",
      },
      {
        q: "Do you see exotics?",
        a: "We see dogs, cats, and small mammals (rabbits, guinea pigs). We refer reptiles and birds to a specialist exotics practice.",
      },
    ],
    greeting: "Wharf Veterinary Clinic, you're through to Robin. How can I help today?",
  },
};

export const VERTICAL_LIST: Vertical[] = Object.values(VERTICALS);

export function getVertical(id: string | null | undefined): Vertical {
  if (id && id in VERTICALS) return VERTICALS[id as VerticalId];
  return VERTICALS.dental;
}
