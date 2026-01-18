import { apiClient } from "./apiClient";
import type { PlanId } from "./plans";

type BillingResponse = {
  checkout_url?: string;
  portal_url?: string;
};

async function postBilling<T>(path: string, body: Record<string, unknown>) {
  const result = await apiClient.post<T, Record<string, unknown>>(path, body);
  if (!result.ok || !result.data) {
    throw new Error(result.error || "Billing request failed");
  }
  return result.data;
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
