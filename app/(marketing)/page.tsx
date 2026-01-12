import Features from "../components/marketing/Features";
import Faq, { faqItems } from "../components/marketing/Faq";
import FinalCta from "../components/marketing/FinalCta";
import Hero from "../components/marketing/Hero";
import HowItWorks from "../components/marketing/HowItWorks";
import InternalLinks from "../components/marketing/InternalLinks";
import JsonLd from "../components/marketing/JsonLd";
import PricingTeaser from "../components/marketing/PricingTeaser";
import ProblemSolution from "../components/marketing/ProblemSolution";
import SocialProof from "../components/marketing/SocialProof";
import { faqJsonLd, organizationJsonLd, softwareApplicationJsonLd, websiteJsonLd } from "../lib/seo/jsonLd";
import { createPageMetadata } from "../lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Polymarket alerts that spot dislocations fast",
  description:
    "PMD delivers Polymarket alerts, prediction market signals, and market dislocation analytics. Read-only monitoring with Telegram delivery.",
  path: "/"
});

export default function MarketingHome() {
  return (
    <div className="space-y-20">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd
        data={faqJsonLd(
          faqItems.map((item) => ({
            question: item.title,
            answer: item.content
          }))
        )}
      />

      <Hero />
      <ProblemSolution />
      <HowItWorks />
      <Features />
      <SocialProof />
      <PricingTeaser />
      <Faq />
      <InternalLinks />
      <FinalCta />
    </div>
  );
}
