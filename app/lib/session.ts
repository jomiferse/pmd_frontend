export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused"
  | string;

export type Subscription = {
  status: SubscriptionStatus;
  plan_id?: string | null;
  plan_name?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
};

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  telegram_chat_id?: number | null;
  telegram_pending?: boolean;
};

export type SessionResponse = {
  user: SessionUser;
  subscription: Subscription | null;
  entitlements?: Record<string, string | number | boolean>;
};

export function hasActiveSubscription(subscription: Subscription | null) {
  return subscription?.status === "active" || subscription?.status === "trialing";
}
