export type AlertItem = {
  id: number;
  type: string;
  market_id: string;
  title: string;
  category: string;
  move: number;
  delta_pct: number;
  market_p_yes: number;
  prev_market_p_yes: number;
  old_price: number | null;
  new_price: number | null;
  liquidity: number;
  volume_24h: number;
  strength: string | null;
  confidence: string | null;
  suggested_action: string | null;
  sustained: number;
  reversal: string;
  delivery_status: string | null;
  filter_reasons: string[];
  market_slug: string | null;
  market_url: string;
  snapshot_bucket: string;
  source_ts: string | null;
  triggered_at: string | null;
  created_at: string;
  message: string | null;
};

export type CopilotRun = {
  run_id: string;
  created_at: string;
  mode: string;
  window_minutes: number;
  caps_remaining_day: number;
  caps_remaining_hour: number;
  daily_limit: number;
  hourly_limit: number;
  digest_limit: number;
  sent: number;
  themes_selected: number;
  skipped_by_reason_counts: Record<string, number>;
  llm_calls_attempted: number;
  llm_calls_succeeded: number;
  telegram_sends_attempted: number;
  telegram_sends_succeeded: number;
};

export type MeResponse = {
  user_id: string | null;
  plan: string | null;
  telegram_chat_id: number | null;
  telegram_pending: boolean;
};
