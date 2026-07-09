import AskButton from "@/components/AskButton";
import { Reveal } from "@/components/Motion";
import { WarpLink } from "@/components/Warp";

export const metadata = {
  title: "The AI Receptionist",
  description:
    "NOVA05's AI receptionist greets every visitor to your website, answers questions about treatments, prices and availability 24/7, and books enquiries into your inbox with name, email and what they need — built for dentists, salons, clinics, and trades.",
  alternates: { canonical: "/receptionist" },
};

const SEGMENTS = [
  "Dentists",
  "Hair & beauty salons",
  "Aesthetics clinics",
  "Physios & osteopaths",
  "Vets",
  "Opticians",
  "Plumbers & trades",
  "Estate agents",
];

const SHIFT = [
  {
    time: "09:12",
    text: "Answers “do you do NHS check-ups?” while your real receptionist is on the phone.",
  },
  {
    time: "13:47",
    text: "Explains your price list to three visitors at once, without putting anyone on hold.",
  },
  {
    time: "19:30",
    text: "You've gone home. It hasn't. It books an enquiry from someone browsing after work.",
  },
  {
    time: "02:05",
    text: "Captures a new-patient enquiry — name, email, what they need — for your morning coffee.",
  },
];

export default function ReceptionistPage() {
  return (
    <>
      <section className="container-x pb-20 pt-44 lg:pt-52">
        <Reveal>
          <p className="eyebrow-space mb-6">The vertical · your front desk</p>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">
            A receptionist for the{" "}
            <em className="serif-accent grad-text font-normal">appointments you're missing.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-starlight/65">
            Every unanswered question on your website is a patient, client, or customer
            who books with someone else. The NOVA05 receptionist greets them, answers
            from your own treatment list and prices, and takes their details — around
            the clock, on every page.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AskButton ask="I run an appointment-based business — how would the AI receptionist work for me?">
              Ask the receptionist yourself →
            </AskButton>
            <WarpLink href="/pricing" className="btn-space-ghost">
              See pricing
            </WarpLink>
          </div>
        </Reveal>
      </section>

      {/* A day on shift */}
      <section className="border-y border-white/[0.07] py-20">
        <div className="container-x">
          <Reveal>
            <p className="eyebrow-space mb-4">One shift · no breaks</p>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              24 hours on the <em className="serif-accent grad-text font-normal">front desk.</em>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SHIFT.map((s, i) => (
              <Reveal key={s.time} delay={i * 100}>
                <div className="glass h-full p-6">
                  <span className="grad-text font-display text-2xl font-bold">{s.time}</span>
                  <p className="mt-3 text-sm leading-relaxed text-starlight/60">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow-space mb-4">Built for booking businesses</p>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              It knows <em className="serif-accent grad-text font-normal">your</em> front desk.
            </h2>
            <ul className="mt-7 space-y-3 text-sm text-starlight/70">
              {[
                "Answers from your treatments, services, prices, opening hours, and policies — nothing invented",
                "Asks the right qualifying questions, then captures name + email + what they need",
                "Every enquiry lands in your inbox with an AI-drafted reply ready to send",
                "Polite out-of-hours behavior — your voicemail never converts; this does",
              ].map((li) => (
                <li key={li} className="flex gap-3">
                  <span className="grad-text font-bold">→</span> {li}
                </li>
              ))}
            </ul>
            <WarpLink href="/pricing" className="btn-nova mt-8">
              Put it on the desk →
            </WarpLink>
          </Reveal>
          <Reveal delay={150}>
            <div className="glass p-7">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-starlight/40">
                who it works for
              </p>
              <div className="flex flex-wrap gap-2">
                {SEGMENTS.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-white/12 bg-white/[0.05] px-3.5 py-1.5 text-sm text-starlight/75"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-sm leading-relaxed text-starlight/55">
                If your business runs on appointments and enquiries, the receptionist
                pays for itself with the first booking it saves.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-x pb-24 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            No website worth greeting people on?{" "}
            <em className="serif-accent grad-text font-normal">We build those too.</em>
          </h2>
          <WarpLink href="/websites" className="btn-space-ghost mt-7">
            Visit the website studio →
          </WarpLink>
        </Reveal>
      </section>
    </>
  );
}
