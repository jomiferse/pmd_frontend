import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "./constants";

export const organizationJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL
});

export const websiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL
});

export const softwareApplicationJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  operatingSystem: "Web",
  applicationCategory: "FinanceApplication",
  description: DEFAULT_DESCRIPTION,
  url: SITE_URL
});

type FaqItem = {
  question: string;
  answer: string;
};

export const faqJsonLd = (items: FaqItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer
    }
  }))
});
