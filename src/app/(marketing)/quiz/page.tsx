import Quiz from "@/components/Quiz";
import { Reveal } from "@/components/Motion";

export const metadata = {
  title: "Mission Readiness Scan",
  description:
    "A free 2-minute quiz that scans your business's online mission readiness — find out whether an AI receptionist, chatbot, new website or SEO tune-up would move the needle most, and get a personal flight plan.",
  alternates: { canonical: "/quiz" },
};

export default function QuizPage() {
  return (
    <>
      <section className="container-x pb-10 pt-44 text-center lg:pt-52">
        <Reveal>
          {/* Nova the mascot (generated with Higgsfield; snapshotted at build) */}
          <img
            src="/brand/mascot.png"
            alt=""
            width={120}
            height={120}
            loading="lazy"
            className="float-slow mx-auto mb-6 h-28 w-28 rounded-3xl object-cover shadow-2xl"
          />
          <p className="eyebrow-space mb-6">Free · 2 minutes · weirdly accurate</p>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">
            The Mission{" "}
            <em className="serif-accent grad-text font-normal">Readiness Scan.</em>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-starlight/60">
            Five questions. One archetype. A personal flight plan for what your
            website should be doing for you — sent by an actual human.
          </p>
        </Reveal>
      </section>
      <section className="container-x pb-28 pt-6">
        <Reveal delay={150}>
          <div className="glass mx-auto max-w-3xl p-8 sm:p-10">
            <Quiz />
          </div>
        </Reveal>
      </section>
    </>
  );
}
