export type UserAlertPreferences = {
  min_liquidity: number | null;
  min_volume_24h: number | null;
  min_abs_price_move: number | null;
  alert_strengths: string[] | null;
  digest_window_minutes: number | null;
  max_alerts_per_digest: number | null;
  max_themes_per_digest: number | null;
  max_markets_per_theme: number | null;
  p_min: number | null;
  p_max: number | null;
  fast_signals_enabled: boolean | null;
  fast_window_minutes: number | null;
  fast_max_themes_per_digest: number | null;
  fast_max_markets_per_theme: number | null;
};

export type EffectiveUserSettings = {
  plan_name: string | null;
  copilot_enabled: boolean;
  allowed_strengths: string[];
  digest_window_minutes: number;
  max_alerts_per_digest: number;
  max_themes_per_digest: number;
  max_markets_per_theme: number;
  min_liquidity: number;
  min_volume_24h: number;
  min_abs_price_move: number;
  p_min: number;
  p_max: number;
  fast_signals_enabled: boolean;
  fast_window_minutes: number;
  fast_max_themes_per_digest: number;
  fast_max_markets_per_theme: number;
  allow_fast_alerts: boolean;
  fast_mode: string;
};

export type SettingsResponse = {
  user_id: string;
  user: {
    copilot_enabled: boolean;
  };
  preferences: UserAlertPreferences;
  effective: EffectiveUserSettings;
  baseline: EffectiveUserSettings;
};

export type SettingsPatch = Partial<UserAlertPreferences> & {
  copilot_enabled?: boolean | null;
};

export type EntitlementLimit<T> = {
  min: T | null;
  max: T | null;
  allowed_values: T[] | null;
};

export type SettingsEntitlements = {
  plan: string | null;
  upgrade_target: string | null;
  features: {
    copilot_enabled: boolean;
    fast_signals_enabled: boolean;
    fast_mode: string;
  };
  limits: {
    min_liquidity: EntitlementLimit<number>;
    min_volume_24h: EntitlementLimit<number>;
    min_abs_price_move: EntitlementLimit<number>;
    alert_strengths: EntitlementLimit<string>;
    digest_window_minutes: EntitlementLimit<number>;
    max_alerts_per_digest: EntitlementLimit<number>;
    max_themes_per_digest: EntitlementLimit<number>;
    max_markets_per_theme: EntitlementLimit<number>;
    p_min: EntitlementLimit<number>;
    p_max: EntitlementLimit<number>;
    fast_window_minutes: EntitlementLimit<number>;
    fast_max_themes_per_digest: EntitlementLimit<number>;
    fast_max_markets_per_theme: EntitlementLimit<number>;
  };
};
