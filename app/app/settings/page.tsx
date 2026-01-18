"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MagicBadge from "../../components/magicui/MagicBadge";
import MagicButton from "../../components/magicui/MagicButton";
import MagicCard from "../../components/magicui/MagicCard";
import MagicInput from "../../components/magicui/MagicInput";
import MagicNotice from "../../components/magicui/MagicNotice";
import MagicSkeleton from "../../components/magicui/MagicSkeleton";
import { apiClient } from "../../lib/apiClient";
import type {
  EffectiveUserSettings,
  EntitlementLimit,
  SettingsEntitlements,
  SettingsPatch,
  SettingsResponse,
  UserAlertPreferences
} from "../../lib/settings";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean | string[]>>({});
  const [entitlements, setEntitlements] = useState<SettingsEntitlements | null>(null);
  const [entitlementsError, setEntitlementsError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([apiClient.getSettings(), apiClient.getEntitlements()])
      .then(([settingsResult, entitlementsResult]) => {
        if (!mounted) return;
        if (settingsResult.status === 401 || entitlementsResult.status === 401) {
          router.replace("/login");
          return;
        }
        if (!settingsResult.ok || !settingsResult.data) {
          setError(settingsResult.error || "Failed to load settings");
          return;
        }
        setSettings(settingsResult.data);
        setForm(buildForm(settingsResult.data));
        setFieldErrors({});
        setError(null);
        if (!entitlementsResult.ok || !entitlementsResult.data) {
          setEntitlements(null);
          setEntitlementsError(entitlementsResult.error || "Plan entitlements unavailable");
          return;
        }
        setEntitlements(entitlementsResult.data);
        setEntitlementsError(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  const validationErrors = useMemo(() => validateForm(form, entitlements), [form, entitlements]);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const hasChanges = useMemo(() => {
    if (!settings) return false;
    return hasFormChanges(form, settings, entitlements);
  }, [form, settings, entitlements]);
  const planLabel = entitlements?.plan || settings?.effective?.plan_name || "Basic";
  const limits = entitlements?.limits;
  const isEditable = Boolean(entitlements);
  const copilotAvailable = entitlements?.features.copilot_enabled ?? false;
  const fastAvailable = entitlements?.features.fast_signals_enabled ?? false;
  const upgradeTarget = entitlements?.upgrade_target;
  const strengthOptions = entitlements?.limits.alert_strengths.allowed_values || settings?.effective?.allowed_strengths || [];
  const digestAllowedValues = limits?.digest_window_minutes.allowed_values;
  const digestWindowOptions =
    digestAllowedValues && digestAllowedValues.length
      ? digestAllowedValues
      : [Number(form.digest_window_minutes || settings?.effective?.digest_window_minutes || 0)].filter((value) => value);
  const handleNumberInput = (key: string, value: string, limit: EntitlementLimit<number> | null | undefined) => {
    updateField(setForm, setFieldErrors, key, clampNumericInput(value, limit));
  };
  const handleSelectInput = (key: string, value: string) => {
    updateField(setForm, setFieldErrors, key, value);
  };
  const getFieldError = (key: string) => fieldErrors[key] || validationErrors[key];

  const onSave = async () => {
    if (!settings) return;
    const patch = buildPatch(form, settings, entitlements);
    if (!Object.keys(patch).length) return;
    setSaving(true);
    setSuccess(null);
    setError(null);
    setFieldErrors({});
    const result = await apiClient.updateSettings(patch);
    if (result.status === 401) {
      router.replace("/login");
      return;
    }
    if (!result.ok || !result.data) {
      if (result.status === 422 && result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        setError(result.error || "Validation failed");
      } else {
        setError(result.error || "Failed to save settings");
      }
      setSaving(false);
      return;
    }
    setSettings(result.data);
    setForm(buildForm(result.data));
    setSuccess("Settings saved.");
    setFieldErrors({});
    setSaving(false);
  };

  const onReset = async () => {
    if (!settings) return;
    const patch = buildResetPatch(settings.preferences);
    if (!Object.keys(patch).length) {
      setForm(buildForm({ ...settings, effective: settings.baseline }));
      return;
    }
    setSaving(true);
    setSuccess(null);
    setError(null);
    setFieldErrors({});
    const result = await apiClient.updateSettings(patch);
    if (result.status === 401) {
      router.replace("/login");
      return;
    }
    if (!result.ok || !result.data) {
      setError(result.error || "Failed to reset settings");
      setSaving(false);
      return;
    }
    setSettings(result.data);
    setForm(buildForm(result.data));
    setSuccess("Defaults restored.");
    setFieldErrors({});
    setSaving(false);
  };

  const onRestore = () => {
    if (!settings) return;
    setForm(buildForm(settings));
    setSuccess(null);
    setError(null);
    setFieldErrors({});
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <MagicSkeleton className="h-24 w-full" />
        <MagicSkeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!settings?.effective) {
    return (
      <section className="space-y-4">
        <MagicNotice tone="error">Settings unavailable. Please refresh.</MagicNotice>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <MagicCard>
        <MagicBadge>Settings</MagicBadge>
        <h2 className="mt-3 text-2xl font-semibold text-ink">User settings</h2>
        <p className="mt-2 text-sm text-slate">
          Tune your alert filters, digest cadence, and FAST mode preferences.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate">
          <span className="rounded-full border border-ink/10 bg-white/80 px-3 py-1">
            Plan: <span className="font-semibold text-ink">{planLabel}</span>
          </span>
          <span>Settings reflect your plan entitlements and server-side defaults.</span>
        </div>
      </MagicCard>

      {error && (
        <MagicNotice tone="error">{error}</MagicNotice>
      )}
      {success && (
        <MagicNotice tone="success">{success}</MagicNotice>
      )}
      {entitlementsError && (
        <MagicNotice tone="warning">{entitlementsError}. Settings are read-only.</MagicNotice>
      )}

      {settings && (
        <>
          <MagicCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate">Alert Filters</p>
                <p className="mt-2 text-lg font-semibold text-ink">Signal thresholds</p>
                <p className="mt-1 text-sm text-slate">
                  Control liquidity, volume, and move filters for alerts.
                </p>
              </div>
              <div className="text-xs text-slate">
                <span className="rounded-full border border-slate/30 px-2 py-1">
                  Plan: <span className="font-semibold text-ink">{planLabel}</span>
                </span>
                <span className="ml-3 rounded-full border border-slate/30 px-2 py-1">
                  Copilot {copilotAvailable ? "Available" : "Locked"}
                </span>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <MagicInput
                  label={SETTINGS_FIELDS.min_liquidity.label}
                  type="number"
                  min={limits?.min_liquidity.min ?? 0}
                  value={String(form.min_liquidity ?? "")}
                  onChange={(event) => handleNumberInput("min_liquidity", event.target.value, limits?.min_liquidity)}
                  disabled={!isEditable}
                />
                {formatLimitHint(limits?.min_liquidity, "min") && (
                  <p className="mt-2 text-xs text-slate">{formatLimitHint(limits?.min_liquidity, "min")}</p>
                )}
                {getFieldError("min_liquidity") && (
                  <p className="mt-2 text-xs text-danger">{getFieldError("min_liquidity")}</p>
                )}
              </div>
              <div>
                <MagicInput
                  label={SETTINGS_FIELDS.min_volume_24h.label}
                  type="number"
                  min={limits?.min_volume_24h.min ?? 0}
                  value={String(form.min_volume_24h ?? "")}
                  onChange={(event) => handleNumberInput("min_volume_24h", event.target.value, limits?.min_volume_24h)}
                  disabled={!isEditable}
                />
                {formatLimitHint(limits?.min_volume_24h, "min") && (
                  <p className="mt-2 text-xs text-slate">{formatLimitHint(limits?.min_volume_24h, "min")}</p>
                )}
                {getFieldError("min_volume_24h") && (
                  <p className="mt-2 text-xs text-danger">{getFieldError("min_volume_24h")}</p>
                )}
              </div>
              <div>
                <MagicInput
                  label={SETTINGS_FIELDS.min_abs_price_move.label}
                  type="number"
                  min={limits?.min_abs_price_move.min ?? 0}
                  step="0.001"
                  value={String(form.min_abs_price_move ?? "")}
                  onChange={(event) => handleNumberInput("min_abs_price_move", event.target.value, limits?.min_abs_price_move)}
                  disabled={!isEditable}
                />
                {formatLimitHint(limits?.min_abs_price_move, "min") && (
                  <p className="mt-2 text-xs text-slate">{formatLimitHint(limits?.min_abs_price_move, "min")}</p>
                )}
                {getFieldError("min_abs_price_move") && (
                  <p className="mt-2 text-xs text-danger">{getFieldError("min_abs_price_move")}</p>
                )}
              </div>
              <div className="grid gap-2">
                <span className="text-sm text-slate">Probability range (0-1)</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  <MagicInput
                    label={SETTINGS_FIELDS.p_min.label}
                    type="number"
                    min={limits?.p_min.min ?? 0}
                    max={limits?.p_min.max ?? 1}
                    step="0.01"
                    value={String(form.p_min ?? "")}
                    onChange={(event) => handleNumberInput("p_min", event.target.value, limits?.p_min)}
                    disabled={!isEditable}
                  />
                  <MagicInput
                    label={SETTINGS_FIELDS.p_max.label}
                    type="number"
                    min={limits?.p_max.min ?? 0}
                    max={limits?.p_max.max ?? 1}
                    step="0.01"
                    value={String(form.p_max ?? "")}
                    onChange={(event) => handleNumberInput("p_max", event.target.value, limits?.p_max)}
                    disabled={!isEditable}
                  />
                </div>
                {formatLimitHint(limits?.p_min, "range") && (
                  <p className="mt-1 text-xs text-slate">{formatLimitHint(limits?.p_min, "range")}</p>
                )}
                {getFieldError("p_min") && (
                  <p className="mt-2 text-xs text-danger">{getFieldError("p_min")}</p>
                )}
                {getFieldError("p_max") && (
                  <p className="mt-2 text-xs text-danger">{getFieldError("p_max")}</p>
                )}
              </div>
            </div>
            {getFieldError("p_range") && (
              <p className="mt-3 text-xs text-danger">{getFieldError("p_range")}</p>
            )}
            <div className="mt-6">
              <p className="text-sm text-slate">Alert strengths</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {strengthOptions.map((strength) => {
                  const selected = (form.alert_strengths as string[])?.includes(strength);
                  return (
                    <button
                      key={strength}
                      type="button"
                      onClick={() => toggleStrength(setForm, setFieldErrors, strength)}
                      disabled={!isEditable}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        selected
                          ? "border-ink bg-ink text-white"
                          : "border-slate/30 text-slate hover:border-ink hover:text-ink"
                      } ${!isEditable ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      {strength}
                    </button>
                  );
                })}
              </div>
              {formatLimitHint(limits?.alert_strengths, "allowed") && (
                <p className="mt-2 text-xs text-slate">{formatLimitHint(limits?.alert_strengths, "allowed")}</p>
              )}
              {getFieldError("alert_strengths") && (
                <p className="mt-2 text-xs text-danger">{getFieldError("alert_strengths")}</p>
              )}
            </div>
          </MagicCard>

          <MagicCard>
            <p className="text-xs uppercase tracking-[0.2em] text-slate">Digest & Limits</p>
            <p className="mt-2 text-lg font-semibold text-ink">Cadence and caps</p>
            <p className="mt-1 text-sm text-slate">
              Adjust digest windows and how many alerts are grouped per run.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-slate">
                {SETTINGS_FIELDS.digest_window_minutes.label}
                <select
                  value={String(form.digest_window_minutes ?? "")}
                  onChange={(event) => handleSelectInput("digest_window_minutes", event.target.value)}
                  disabled={!isEditable}
                  className="mt-2 w-full rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-sm text-ink shadow-soft"
                >
                  {digestWindowOptions.map((value) => (
                    <option key={value} value={value}>
                      {value} minutes
                    </option>
                  ))}
                </select>
                {formatLimitHint(limits?.digest_window_minutes, "allowed", "minutes") && (
                  <p className="mt-2 text-xs text-slate">
                    {formatLimitHint(limits?.digest_window_minutes, "allowed", "minutes")}
                  </p>
                )}
                {getFieldError("digest_window_minutes") && (
                  <p className="mt-2 text-xs text-danger">{getFieldError("digest_window_minutes")}</p>
                )}
              </label>
              <div>
                <MagicInput
                  label={SETTINGS_FIELDS.max_alerts_per_digest.label}
                  type="number"
                  min={limits?.max_alerts_per_digest.min ?? 0}
                  max={limits?.max_alerts_per_digest.max ?? undefined}
                  value={String(form.max_alerts_per_digest ?? "")}
                  onChange={(event) => handleNumberInput("max_alerts_per_digest", event.target.value, limits?.max_alerts_per_digest)}
                  disabled={!isEditable}
                />
                {formatLimitHint(limits?.max_alerts_per_digest, "max") && (
                  <p className="mt-2 text-xs text-slate">{formatLimitHint(limits?.max_alerts_per_digest, "max")}</p>
                )}
                {getFieldError("max_alerts_per_digest") && (
                  <p className="mt-2 text-xs text-danger">{getFieldError("max_alerts_per_digest")}</p>
                )}
              </div>
              <div>
                <MagicInput
                  label={SETTINGS_FIELDS.max_themes_per_digest.label}
                  type="number"
                  min={limits?.max_themes_per_digest.min ?? 0}
                  max={limits?.max_themes_per_digest.max ?? undefined}
                  value={String(form.max_themes_per_digest ?? "")}
                  onChange={(event) => handleNumberInput("max_themes_per_digest", event.target.value, limits?.max_themes_per_digest)}
                  disabled={!isEditable}
                />
                {formatLimitHint(limits?.max_themes_per_digest, "max") && (
                  <p className="mt-2 text-xs text-slate">{formatLimitHint(limits?.max_themes_per_digest, "max")}</p>
                )}
                {getFieldError("max_themes_per_digest") && (
                  <p className="mt-2 text-xs text-danger">{getFieldError("max_themes_per_digest")}</p>
                )}
              </div>
              <div>
                <MagicInput
                  label={SETTINGS_FIELDS.max_markets_per_theme.label}
                  type="number"
                  min={limits?.max_markets_per_theme.min ?? 0}
                  max={limits?.max_markets_per_theme.max ?? undefined}
                  value={String(form.max_markets_per_theme ?? "")}
                  onChange={(event) => handleNumberInput("max_markets_per_theme", event.target.value, limits?.max_markets_per_theme)}
                  disabled={!isEditable}
                />
                {formatLimitHint(limits?.max_markets_per_theme, "max") && (
                  <p className="mt-2 text-xs text-slate">{formatLimitHint(limits?.max_markets_per_theme, "max")}</p>
                )}
                {getFieldError("max_markets_per_theme") && (
                  <p className="mt-2 text-xs text-danger">{getFieldError("max_markets_per_theme")}</p>
                )}
              </div>
            </div>
          </MagicCard>

          <MagicCard>
            <p className="text-xs uppercase tracking-[0.2em] text-slate">Copilot</p>
            <p className="mt-2 text-lg font-semibold text-ink">AI copilot access</p>
            <p className="mt-1 text-sm text-slate">
              Toggle Copilot for your account when your plan supports it.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-slate/30 px-3 py-1 text-xs text-ink">
                Effective: {settings.effective.copilot_enabled ? "Enabled" : "Disabled"}
              </span>
              {copilotAvailable ? (
                <button
                  type="button"
                  onClick={() => toggleBoolean(setForm, setFieldErrors, "copilot_enabled")}
                  disabled={!isEditable}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    form.copilot_enabled ? "bg-accent text-ink" : "bg-slate/10 text-slate"
                  } ${!isEditable ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {form.copilot_enabled ? "Copilot on" : "Copilot off"}
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate">
                  <span>Requires {formatPlanName(upgradeTarget) || "a higher plan"} to enable Copilot.</span>
                  <Link href="/app/billing" className="text-ink underline underline-offset-4">
                    Upgrade
                  </Link>
                </div>
              )}
              {getFieldError("copilot_enabled") && (
                <p className="w-full text-xs text-danger">{getFieldError("copilot_enabled")}</p>
              )}
            </div>
          </MagicCard>

          <MagicCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate">FAST Mode</p>
                <p className="mt-2 text-lg font-semibold text-ink">Faster signal delivery</p>
                <p className="mt-1 text-sm text-slate">
                  Use FAST alerts for tighter windows and smaller theme caps.
                </p>
              </div>
              {!fastAvailable && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-warning/40 bg-warning/20 px-3 py-1 text-xs text-ink">
                    Requires {formatPlanName(upgradeTarget) || "a higher plan"}
                  </span>
                  <Link href="/app/billing" className="text-xs text-ink underline underline-offset-4">
                    Upgrade
                  </Link>
                </div>
              )}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-sm text-ink shadow-soft">
                {SETTINGS_FIELDS.fast_signals_enabled.label}
                <button
                  type="button"
                  onClick={() => toggleBoolean(setForm, setFieldErrors, "fast_signals_enabled")}
                  disabled={!fastAvailable || !isEditable}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    form.fast_signals_enabled
                      ? "bg-accent text-ink"
                      : "bg-slate/10 text-slate"
                  } ${!fastAvailable || !isEditable ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {form.fast_signals_enabled ? "Enabled" : "Disabled"}
                </button>
              </label>
              <div>
                <MagicInput
                  label={SETTINGS_FIELDS.fast_window_minutes.label}
                  type="number"
                  min={limits?.fast_window_minutes.min ?? 1}
                  value={String(form.fast_window_minutes ?? "")}
                  onChange={(event) => handleNumberInput("fast_window_minutes", event.target.value, limits?.fast_window_minutes)}
                  disabled={!fastAvailable || !isEditable}
                />
                {formatLimitHint(limits?.fast_window_minutes, "min") && (
                  <p className="mt-2 text-xs text-slate">{formatLimitHint(limits?.fast_window_minutes, "min")}</p>
                )}
                {getFieldError("fast_window_minutes") && (
                  <p className="mt-2 text-xs text-danger">{getFieldError("fast_window_minutes")}</p>
                )}
              </div>
              <div>
                <MagicInput
                  label={SETTINGS_FIELDS.fast_max_themes_per_digest.label}
                  type="number"
                  min={limits?.fast_max_themes_per_digest.min ?? 0}
                  max={limits?.fast_max_themes_per_digest.max ?? undefined}
                  value={String(form.fast_max_themes_per_digest ?? "")}
                  onChange={(event) => handleNumberInput("fast_max_themes_per_digest", event.target.value, limits?.fast_max_themes_per_digest)}
                  disabled={!fastAvailable || !isEditable}
                />
                {formatLimitHint(limits?.fast_max_themes_per_digest, "max") && (
                  <p className="mt-2 text-xs text-slate">
                    {formatLimitHint(limits?.fast_max_themes_per_digest, "max")}
                  </p>
                )}
                {getFieldError("fast_max_themes_per_digest") && (
                  <p className="mt-2 text-xs text-danger">{getFieldError("fast_max_themes_per_digest")}</p>
                )}
              </div>
              <div>
                <MagicInput
                  label={SETTINGS_FIELDS.fast_max_markets_per_theme.label}
                  type="number"
                  min={limits?.fast_max_markets_per_theme.min ?? 0}
                  max={limits?.fast_max_markets_per_theme.max ?? undefined}
                  value={String(form.fast_max_markets_per_theme ?? "")}
                  onChange={(event) => handleNumberInput("fast_max_markets_per_theme", event.target.value, limits?.fast_max_markets_per_theme)}
                  disabled={!fastAvailable || !isEditable}
                />
                {formatLimitHint(limits?.fast_max_markets_per_theme, "max") && (
                  <p className="mt-2 text-xs text-slate">
                    {formatLimitHint(limits?.fast_max_markets_per_theme, "max")}
                  </p>
                )}
                {getFieldError("fast_max_markets_per_theme") && (
                  <p className="mt-2 text-xs text-danger">{getFieldError("fast_max_markets_per_theme")}</p>
                )}
              </div>
            </div>
            {getFieldError("fast_signals_enabled") && (
              <p className="mt-3 text-xs text-danger">{getFieldError("fast_signals_enabled")}</p>
            )}
          </MagicCard>

          <MagicCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate">Actions</p>
                <p className="mt-2 text-lg font-semibold text-ink">Save your changes</p>
                <p className="mt-1 text-sm text-slate">
                  Save updates or restore the last saved configuration.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <MagicButton variant="secondary" onClick={onRestore} disabled={saving || !isEditable}>
                  Restore last saved
                </MagicButton>
                <MagicButton variant="secondary" onClick={onReset} disabled={saving || !isEditable}>
                  Reset to defaults
                </MagicButton>
                <MagicButton onClick={onSave} disabled={saving || hasValidationErrors || !hasChanges || !isEditable}>
                  {saving ? "Saving..." : "Save changes"}
                </MagicButton>
              </div>
            </div>
            {hasValidationErrors && (
              <p className="mt-3 text-xs text-danger">
                Fix validation errors before saving.
              </p>
            )}
          </MagicCard>
        </>
      )}

    </section>
  );
}

const SETTINGS_FIELDS = {
  min_liquidity: {
    label: "Minimum liquidity",
    inputType: "number",
    format: formatNumberValue,
    parse: parseNumber
  },
  min_volume_24h: {
    label: "Minimum 24h volume",
    inputType: "number",
    format: formatNumberValue,
    parse: parseNumber
  },
  min_abs_price_move: {
    label: "Minimum absolute move",
    inputType: "number",
    format: formatNumberValue,
    parse: parseNumber
  },
  digest_window_minutes: {
    label: "Digest window",
    inputType: "select",
    format: formatNumberValue,
    parse: parseNumber
  },
  max_alerts_per_digest: {
    label: "Max alerts per digest",
    inputType: "number",
    format: formatNumberValue,
    parse: parseNumber
  },
  max_themes_per_digest: {
    label: "Max themes per digest",
    inputType: "number",
    format: formatNumberValue,
    parse: parseNumber
  },
  max_markets_per_theme: {
    label: "Max markets per theme",
    inputType: "number",
    format: formatNumberValue,
    parse: parseNumber
  },
  p_min: {
    label: "Min probability",
    inputType: "number",
    format: formatNumberValue,
    parse: parseNumber
  },
  p_max: {
    label: "Max probability",
    inputType: "number",
    format: formatNumberValue,
    parse: parseNumber
  },
  fast_signals_enabled: {
    label: "FAST signals",
    inputType: "toggle",
    format: formatBooleanValue,
    parse: parseBooleanValue
  },
  fast_window_minutes: {
    label: "FAST window (minutes)",
    inputType: "number",
    format: formatNumberValue,
    parse: parseNumber
  },
  fast_max_themes_per_digest: {
    label: "FAST max themes per digest",
    inputType: "number",
    format: formatNumberValue,
    parse: parseNumber
  },
  fast_max_markets_per_theme: {
    label: "FAST max markets per theme",
    inputType: "number",
    format: formatNumberValue,
    parse: parseNumber
  },
  alert_strengths: {
    label: "Alert strengths",
    inputType: "multiselect",
    format: formatStrengthValues,
    parse: parseStrengthValues
  },
  copilot_enabled: {
    label: "Copilot",
    inputType: "toggle",
    format: formatBooleanValue,
    parse: parseBooleanValue
  }
} as const;

type SettingsFieldKey = keyof typeof SETTINGS_FIELDS;

const NUMBER_FIELDS: Array<keyof UserAlertPreferences> = [
  "min_liquidity",
  "min_volume_24h",
  "min_abs_price_move",
  "digest_window_minutes",
  "max_alerts_per_digest",
  "max_themes_per_digest",
  "max_markets_per_theme",
  "p_min",
  "p_max",
  "fast_window_minutes",
  "fast_max_themes_per_digest",
  "fast_max_markets_per_theme"
];

function buildForm(settings: SettingsResponse) {
  const effective = getEffectiveSafe(settings);
  return {
    min_liquidity: formatFieldValue("min_liquidity", effective.min_liquidity),
    min_volume_24h: formatFieldValue("min_volume_24h", effective.min_volume_24h),
    min_abs_price_move: formatFieldValue("min_abs_price_move", effective.min_abs_price_move),
    alert_strengths: formatFieldValue("alert_strengths", effective.allowed_strengths || []),
    digest_window_minutes: formatFieldValue("digest_window_minutes", effective.digest_window_minutes),
    max_alerts_per_digest: formatFieldValue("max_alerts_per_digest", effective.max_alerts_per_digest),
    max_themes_per_digest: formatFieldValue("max_themes_per_digest", effective.max_themes_per_digest),
    max_markets_per_theme: formatFieldValue("max_markets_per_theme", effective.max_markets_per_theme),
    p_min: formatFieldValue("p_min", effective.p_min),
    p_max: formatFieldValue("p_max", effective.p_max),
    fast_signals_enabled: formatFieldValue("fast_signals_enabled", effective.fast_signals_enabled),
    fast_window_minutes: formatFieldValue("fast_window_minutes", effective.fast_window_minutes),
    fast_max_themes_per_digest: formatFieldValue("fast_max_themes_per_digest", effective.fast_max_themes_per_digest),
    fast_max_markets_per_theme: formatFieldValue("fast_max_markets_per_theme", effective.fast_max_markets_per_theme),
    copilot_enabled: formatFieldValue("copilot_enabled", settings.user?.copilot_enabled ?? false)
  };
}

function formatFieldValue(key: SettingsFieldKey, value: unknown) {
  return SETTINGS_FIELDS[key].format(value);
}

function updateField(
  setForm: React.Dispatch<React.SetStateAction<Record<string, string | boolean | string[]>>>,
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  key: string,
  value: string | boolean | string[]
) {
  setForm((prev) => ({ ...prev, [key]: value }));
  setFieldErrors((prev) => {
    if (!prev[key]) return prev;
    const next = { ...prev };
    delete next[key];
    return next;
  });
}

function toggleBoolean(
  setForm: React.Dispatch<React.SetStateAction<Record<string, string | boolean | string[]>>>,
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  key: string
) {
  setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  setFieldErrors((prev) => {
    if (!prev[key]) return prev;
    const next = { ...prev };
    delete next[key];
    return next;
  });
}

function toggleStrength(
  setForm: React.Dispatch<React.SetStateAction<Record<string, string | boolean | string[]>>>,
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  strength: string
) {
  setForm((prev) => {
    const current = new Set((prev.alert_strengths as string[]) || []);
    if (current.has(strength)) {
      current.delete(strength);
    } else {
      current.add(strength);
    }
    return { ...prev, alert_strengths: Array.from(current) };
  });
  setFieldErrors((prev) => {
    if (!prev.alert_strengths) return prev;
    const next = { ...prev };
    delete next.alert_strengths;
    return next;
  });
}

function parseFieldValue(key: SettingsFieldKey, value: unknown) {
  return SETTINGS_FIELDS[key].parse(value);
}

function parseNumber(value: unknown) {
  if (typeof value !== "string") return null;
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumberValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function formatBooleanValue(value: unknown) {
  return Boolean(value);
}

function parseBooleanValue(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function formatStrengthValues(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function parseStrengthValues(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function hasFormChanges(
  form: Record<string, string | boolean | string[]>,
  settings: SettingsResponse,
  entitlements: SettingsEntitlements | null
) {
  const current = buildPatch(form, settings, entitlements);
  return Object.keys(current).length > 0;
}

function buildPatch(
  form: Record<string, string | boolean | string[]>,
  settings: SettingsResponse,
  entitlements: SettingsEntitlements | null
): SettingsPatch {
  const patch: Partial<UserAlertPreferences> = {};
  const extras: Pick<SettingsPatch, "copilot_enabled"> = {};
  const effective = getEffectiveSafe(settings);
  const features = entitlements?.features;
  const limits = entitlements?.limits;
  NUMBER_FIELDS.forEach((field) => {
    const parsed = parseFieldValue(field as SettingsFieldKey, form[field]);
    const current = effective[field as keyof EffectiveUserSettings];
    if (typeof parsed === "number" && parsed !== current) {
      (patch as Record<keyof UserAlertPreferences, number | null | undefined>)[field] = parsed;
    }
  });
  if (features?.fast_signals_enabled && form.fast_signals_enabled !== effective.fast_signals_enabled) {
    patch.fast_signals_enabled = Boolean(form.fast_signals_enabled);
  }
  if (
    features?.copilot_enabled &&
    typeof form.copilot_enabled === "boolean" &&
    form.copilot_enabled !== settings.user.copilot_enabled
  ) {
    extras.copilot_enabled = Boolean(form.copilot_enabled);
  }
  const allowedStrengths = new Set(limits?.alert_strengths.allowed_values || effective.allowed_strengths || []);
  const strengths = Array.from(new Set((form.alert_strengths as string[]) || []))
    .map((strength) => strength.toUpperCase())
    .filter((strength) => allowedStrengths.size === 0 || allowedStrengths.has(strength))
    .sort();
  const currentStrengths = [...(effective.allowed_strengths || [])].sort();
  if (strengths.join(",") !== currentStrengths.join(",")) {
    patch.alert_strengths = strengths;
  }
  return { ...patch, ...extras };
}

function buildResetPatch(preferences: UserAlertPreferences | null | undefined): SettingsPatch {
  const safePrefs: UserAlertPreferences = preferences || {
    min_liquidity: null,
    min_volume_24h: null,
    min_abs_price_move: null,
    alert_strengths: null,
    digest_window_minutes: null,
    max_alerts_per_digest: null,
    max_themes_per_digest: null,
    max_markets_per_theme: null,
    p_min: null,
    p_max: null,
    fast_signals_enabled: null,
    fast_window_minutes: null,
    fast_max_themes_per_digest: null,
    fast_max_markets_per_theme: null
  };
  const patch: SettingsPatch = {};
  const keys: Array<keyof UserAlertPreferences> = [
    "min_liquidity",
    "min_volume_24h",
    "min_abs_price_move",
    "digest_window_minutes",
    "max_alerts_per_digest",
    "max_themes_per_digest",
    "max_markets_per_theme",
    "p_min",
    "p_max",
    "fast_signals_enabled",
    "fast_window_minutes",
    "fast_max_themes_per_digest",
    "fast_max_markets_per_theme"
  ];
  keys.forEach((key) => {
    if (safePrefs[key] !== null) {
      patch[key] = null;
    }
  });
  if ((safePrefs.alert_strengths || []).length > 0) {
    patch.alert_strengths = null;
  }
  return patch;
}

function validateForm(form: Record<string, string | boolean | string[]>, entitlements: SettingsEntitlements | null) {
  const errors: Record<string, string> = {};
  const limits = entitlements?.limits;
  const minFields = ["min_liquidity", "min_volume_24h", "min_abs_price_move"] as const;
  minFields.forEach((field) => {
    const parsed = parseNumber(form[field]);
    if (parsed === null) {
      errors[field] = "Required.";
    } else if (parsed < 0) {
      errors[field] = "Must be positive.";
    } else {
      const limit = limits?.[field];
      if (limit?.min !== null && limit?.min !== undefined && parsed < limit.min) {
        errors[field] = `Must be >= ${limit.min}.`;
      }
    }
  });
  const pMin = parseNumber(form.p_min);
  const pMax = parseNumber(form.p_max);
  if (pMin === null || pMax === null) {
    errors.p_range = "Probability values are required.";
  } else if (pMin < 0 || pMin > 1 || pMax < 0 || pMax > 1 || pMin >= pMax) {
    errors.p_range = "Use values between 0 and 1 with min < max.";
  } else {
    if (limits?.p_min?.min !== null && limits?.p_min?.min !== undefined && pMin < limits.p_min.min) {
      errors.p_range = `Min probability must be >= ${limits.p_min.min}.`;
    }
    if (limits?.p_max?.max !== null && limits?.p_max?.max !== undefined && pMax > limits.p_max.max) {
      errors.p_range = `Max probability must be <= ${limits.p_max.max}.`;
    }
  }
  const nonNegativeFields = [
    "max_alerts_per_digest",
    "max_themes_per_digest",
    "max_markets_per_theme",
    "fast_max_themes_per_digest",
    "fast_max_markets_per_theme"
  ] as const;
  nonNegativeFields.forEach((field) => {
    const parsed = parseNumber(form[field]);
    if (parsed === null || parsed < 0) {
      errors[field] = "Must be zero or greater.";
    } else {
      const limit = limits?.[field];
      const limitMax = limit?.max ?? null;
      if (limitMax !== null && parsed > limitMax) {
        errors[field] = `Must be <= ${limitMax}.`;
      }
    }
  });
  const positiveFields = ["fast_window_minutes", "digest_window_minutes"] as const;
  positiveFields.forEach((field) => {
    const parsed = parseNumber(form[field]);
    if (parsed === null || parsed <= 0) {
      errors[field] = "Must be greater than zero.";
    } else {
      const limit = limits?.[field];
      const limitMin = limit?.min ?? null;
      if (limitMin !== null && parsed < limitMin) {
        errors[field] = `Must be >= ${limitMin}.`;
      }
    }
  });
  if (limits?.digest_window_minutes?.allowed_values?.length) {
    const digestValue = parseNumber(form.digest_window_minutes);
    if (digestValue !== null && !limits.digest_window_minutes.allowed_values.includes(digestValue)) {
      errors.digest_window_minutes = "Select an allowed digest window.";
    }
  }
  if (!Array.isArray(form.alert_strengths) || (form.alert_strengths as string[]).length === 0) {
    errors.alert_strengths = "Select at least one strength.";
  } else if (limits?.alert_strengths?.allowed_values?.length) {
    const allowed = new Set(limits.alert_strengths.allowed_values);
    const invalid = (form.alert_strengths as string[]).filter((strength) => !allowed.has(strength));
    if (invalid.length) {
      errors.alert_strengths = "Select only allowed strengths.";
    }
  }
  return errors;
}

function formatLimitHint(
  limit: EntitlementLimit<number | string> | null | undefined,
  kind: "min" | "max" | "range" | "allowed",
  unit?: string
) {
  if (!limit) return null;
  const suffix = unit ? ` ${unit}` : "";
  if (kind === "min" && limit.min !== null && limit.min !== undefined) {
    return `Min: ${limit.min}${suffix}`;
  }
  if (kind === "max" && limit.max !== null && limit.max !== undefined) {
    return `Max: ${limit.max}${suffix}`;
  }
  if (kind === "range" && limit.min !== null && limit.min !== undefined && limit.max !== null && limit.max !== undefined) {
    return `Plan range: ${limit.min} - ${limit.max}${suffix}`;
  }
  if (kind === "allowed" && limit.allowed_values && limit.allowed_values.length) {
    return `Allowed: ${limit.allowed_values.join(", ")}${suffix}`;
  }
  return null;
}

function clampNumericInput(value: string, limit: EntitlementLimit<number> | null | undefined) {
  if (value.trim() === "") return "";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  let next = parsed;
  if (limit?.min !== null && limit?.min !== undefined) {
    next = Math.max(next, limit.min);
  }
  if (limit?.max !== null && limit?.max !== undefined) {
    next = Math.min(next, limit.max);
  }
  if (limit?.allowed_values && limit.allowed_values.length) {
    if (!limit.allowed_values.includes(next)) {
      next = limit.allowed_values.reduce((closest, current) =>
        Math.abs(current - next) < Math.abs(closest - next) ? current : closest
      );
    }
  }
  return String(next);
}

function formatPlanName(planName: string | null | undefined) {
  if (!planName) return "";
  return `${planName.charAt(0).toUpperCase()}${planName.slice(1)}`;
}

function getEffectiveSafe(settings: SettingsResponse) {
  return (
    settings.effective || {
      plan_name: null,
      copilot_enabled: false,
      allowed_strengths: [],
      digest_window_minutes: 0,
      max_alerts_per_digest: 0,
      max_themes_per_digest: 0,
      max_markets_per_theme: 0,
      min_liquidity: 0,
      min_volume_24h: 0,
      min_abs_price_move: 0,
      p_min: 0,
      p_max: 1,
      fast_signals_enabled: false,
      fast_window_minutes: 0,
      fast_max_themes_per_digest: 0,
      fast_max_markets_per_theme: 0,
      allow_fast_alerts: false,
      fast_mode: "WATCH_ONLY"
    }
  );
}
