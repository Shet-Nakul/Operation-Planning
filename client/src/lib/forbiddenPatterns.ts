import type { ForbiddenPattern } from '../types/settings';
import { DEFAULT_FORBIDDEN_PATTERNS } from '../types/settings';

/**
 * Settings UI uses human labels (`Night → Early`).
 * The roster solver (via current backend passthrough) expects:
 *   { name, active, hard, weight, pattern: ["N","E"], reason }
 *
 * This module is the frontend bridge so we persist solver-compatible JSON
 * without requiring a backend transform.
 */

const ALIAS_TO_LABEL: Record<string, string> = {
  E: 'Early',
  D: 'Day',
  L: 'Late',
  N: 'Night',
};

const LABEL_TO_ALIAS: Record<string, string> = {
  early: 'E',
  e: 'E',
  day: 'D',
  d: 'D',
  late: 'L',
  l: 'L',
  night: 'N',
  n: 'N',
  morning: 'E',
  afternoon: 'L',
};

const UI_ID_TO_SOLVER: Record<
  string,
  { name: string; weight: number; aliases: string[] | null }
> = {
  'late-day': { name: 'late_followed_day', weight: 14, aliases: ['L', 'D'] },
  'day-early-day': { name: 'day_followed_early_followed_day', weight: 12, aliases: ['D', 'E', 'D'] },
  'fri-off-weekend': { name: 'friday_off_before_weekend', weight: 10, aliases: null },
  'late-early': { name: 'late_followed_early', weight: 28, aliases: ['L', 'E'] },
  'late-night': { name: 'late_followed_night', weight: 28, aliases: ['L', 'N'] },
  'day-night': { name: 'day_followed_night', weight: 22, aliases: ['D', 'N'] },
  'night-day': { name: 'night_followed_day', weight: 35, aliases: ['N', 'D'] },
  'night-early': { name: 'night_followed_early', weight: 35, aliases: ['N', 'E'] },
};

const LABEL_PATTERN_TO_ID: Record<string, string> = {
  'late → day': 'late-day',
  'day → early → day': 'day-early-day',
  'friday off before weekend': 'fri-off-weekend',
  'late → early': 'late-early',
  'late → night': 'late-night',
  'day → night': 'day-night',
  'night → day': 'night-day',
  'night → early': 'night-early',
};

function aliasesToLabel(aliases: string[]): string {
  return aliases.map((a) => ALIAS_TO_LABEL[String(a).toUpperCase()] ?? String(a)).join(' → ');
}

function labelToAliases(label: string): string[] | null {
  const raw = String(label ?? '').trim();
  if (!raw) return null;
  if (!raw.includes('→') && !raw.includes(',')) return null;

  const parts = raw.includes('→') ? raw.split('→') : raw.split(',');
  const aliases = parts
    .map((p) => LABEL_TO_ALIAS[p.trim().toLowerCase()])
    .filter((a): a is string => Boolean(a));
  return aliases.length >= 2 ? aliases : null;
}

function resolveUiId(p: ForbiddenPattern): string {
  const fromId = String(p.id ?? '').trim();
  if (fromId && UI_ID_TO_SOLVER[fromId]) return fromId;
  const fromLabel = LABEL_PATTERN_TO_ID[String(p.pattern ?? '').trim().toLowerCase()];
  if (fromLabel) return fromLabel;
  return fromId || String(p.pattern ?? '').trim();
}

/** Convert UI catalog rows → solver-compatible records for API persistence. */
export function toSolverForbiddenPatterns(patterns: ForbiddenPattern[]): Record<string, unknown>[] {
  return (patterns ?? []).map((p) => {
    const uiId = resolveUiId(p);
    const known = UI_ID_TO_SOLVER[uiId];
    const aliases = known?.aliases ?? labelToAliases(p.pattern);
    const name = known?.name ?? uiId.replace(/-/g, '_');
    const weight = known?.weight ?? 10;
    const reason = String(p.description ?? '').trim() || 'Forbidden shift sequence';
    const active = p.enabled !== false;

    const base: Record<string, unknown> = {
      id: uiId,
      name,
      active,
      // Keep `enabled` too so older UI readers still work if any remain.
      enabled: active,
      hard: false,
      weight,
      reason,
      description: reason,
    };

    // Only sequence constraints include `pattern` as a list.
    // Non-sequence items (e.g. Friday Off) omit `pattern` so the current
    // backend does not forward them into the roster payload.
    if (aliases && aliases.length >= 2) {
      base.pattern = aliases;
      base.label = aliasesToLabel(aliases);
    } else {
      base.label = String(p.pattern ?? '').trim() || uiId;
    }

    return base;
  });
}

/** Convert stored API rows (solver or legacy UI) → Settings UI rows. */
export function fromSolverForbiddenPatterns(value: unknown): ForbiddenPattern[] {
  if (!Array.isArray(value)) return [];

  const parsed = value
    .map((p: any) => {
      if (!p || typeof p !== 'object') return null;

      // Solver / new persisted shape
      if (Array.isArray(p.pattern)) {
        const aliases = p.pattern.map((x: unknown) => String(x ?? '').trim().toUpperCase()).filter(Boolean);
        const label = String(p.label ?? '').trim() || aliasesToLabel(aliases);
        const id =
          String(p.id ?? '').trim() ||
          LABEL_PATTERN_TO_ID[label.toLowerCase()] ||
          String(p.name ?? label);
        return {
          id,
          pattern: label,
          description: String(p.reason ?? p.description ?? ''),
          enabled: Boolean(p.active ?? p.enabled ?? true),
        } satisfies ForbiddenPattern;
      }

      // Legacy UI shape: pattern is a display string
      if (typeof p.pattern === 'string' && p.pattern.trim()) {
        return {
          id: String(p.id ?? p.pattern),
          pattern: p.pattern.trim(),
          description: String(p.description ?? p.reason ?? ''),
          enabled: Boolean(p.enabled ?? p.active ?? true),
        } satisfies ForbiddenPattern;
      }

      // Non-sequence stored without pattern list
      const label = String(p.label ?? p.name ?? '').trim();
      if (!label) return null;
      return {
        id: String(p.id ?? label),
        pattern: label.replace(/_/g, ' '),
        description: String(p.reason ?? p.description ?? ''),
        enabled: Boolean(p.active ?? p.enabled ?? true),
      } satisfies ForbiddenPattern;
    })
    .filter((p): p is ForbiddenPattern => Boolean(p?.id && p?.pattern));

  return mergeMissingDefaultPatterns(parsed, DEFAULT_FORBIDDEN_PATTERNS);
}

/**
 * Ensure newly added catalog defaults (e.g. Late → Night) appear even if the
 * DB still has an older pattern list. Does not override existing rows.
 */
export function mergeMissingDefaultPatterns(
  current: ForbiddenPattern[],
  defaults: ForbiddenPattern[] = DEFAULT_FORBIDDEN_PATTERNS,
): ForbiddenPattern[] {
  const byId = new Map(current.map((p) => [p.id, p]));
  for (const d of defaults) {
    if (!byId.has(d.id)) byId.set(d.id, d);
  }
  return Array.from(byId.values());
}
