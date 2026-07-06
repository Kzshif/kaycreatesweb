import { FAQS } from "@/lib/faq";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kaycreatesweb-reception.netlify.app";

// JSON-LD structured data for AEO: Organization, Service (with GBP offer), and
// FAQPage. Answer engines use these to understand and cite the page.
export function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: "kaycreatesweb",
        url: SITE_URL,
        description:
          "AI receptionist for UK dental, GP, physiotherapy, and veterinary practices.",
        areaServed: "GB",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Newbury",
          addressCountry: "GB",
        },
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/#service`,
        name: "AI receptionist for clinics",
        serviceType: "AI phone answering and appointment booking",
        provider: { "@id": `${SITE_URL}/#org` },
        areaServed: "GB",
        description:
          "An AI receptionist that answers every call 24/7, books appointments, and takes and triages messages for UK healthcare practices.",
        offers: {
          "@type": "Offer",
          price: "29",
          priceCurrency: "GBP",
          description: "Starter plan, per practice, per month.",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
