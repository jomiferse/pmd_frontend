export type PlanId = "basic" | "pro" | "elite";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  price: string;
  description: string;
  entitlements: {
    digest_window: string;
    max_themes: string;
    strengths: string;
    copilot: string;
    fast_mode: string;
  };
  cta: string;
};

export const plans: PlanDefinition[] = [
  {
    id: "basic",
    name: "Basic",
    price: "$10/mo",
    description: "Foundational signal access with room to explore.",
    entitlements: {
      digest_window: "60 min",
      max_themes: "3 themes",
      strengths: "Low + medium",
      copilot: "Off",
      fast_mode: "Off"
    },
    cta: "Start Basic"
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29/mo",
    description: "Higher cadence, wider theme coverage, and Copilot on.",
    entitlements: {
      digest_window: "30 min",
      max_themes: "5 themes",
      strengths: "Low + medium + high",
      copilot: "On",
      fast_mode: "Watch"
    },
    cta: "Go Pro"
  },
  {
    id: "elite",
    name: "Elite",
    price: "$99/mo",
    description: "Always-on monitoring with FAST mode and premium caps.",
    entitlements: {
      digest_window: "15 min",
      max_themes: "10 themes",
      strengths: "All strengths",
      copilot: "Always-on",
      fast_mode: "Full"
    },
    cta: "Unlock Elite"
  }
];
