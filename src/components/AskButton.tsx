"use client";

// A button that opens the on-page Nova demo widget with a pre-written message —
// so "Get a quote" style CTAs land in a live AI conversation (and the lead
// inbox) instead of a form.

declare global {
  interface Window {
    __novaAsk?: (text: string) => void;
    __novaOpen?: () => void;
  }
}

export default function AskButton({
  ask,
  className = "btn-nova",
  children,
}: {
  ask: string;
  className?: string;
  children: React.ReactNode;
}) {
  function click() {
    const start = Date.now();
    const tryAsk = () => {
      if (window.__novaAsk) {
        window.__novaAsk(ask);
        return;
      }
      if (Date.now() - start < 6000) setTimeout(tryAsk, 250);
    };
    tryAsk();
  }
  return (
    <button type="button" onClick={click} className={className}>
      {children}
    </button>
  );
}
