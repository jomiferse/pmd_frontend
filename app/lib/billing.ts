import { API_BASE_URL, readJson } from "./api";
import type { PlanId } from "./plans";

type BillingResponse = {
  checkout_url?: string;
  portal_url?: string;
};

async function postBilling<T>(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = ((await readJson<T>(response)) ?? {}) as T;
  if (!response.ok) {
    throw new Error((payload as { detail?: string })?.detail || "Billing request failed");
  }
  return payload;
}

export async function createCheckoutSession(planId: PlanId) {
  const payload = await postBilling<BillingResponse>("/billing/checkout-session", {
    plan_id: planId
  });
  if (!payload.checkout_url) {
    throw new Error("Missing checkout URL");
  }
  return payload.checkout_url;
}

export async function createPortalSession() {
  const payload = await postBilling<BillingResponse>("/billing/portal-session", {});
  if (!payload.portal_url) {
    throw new Error("Missing portal URL");
  }
  return payload.portal_url;
}
