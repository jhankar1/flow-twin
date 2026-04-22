/**
 * Logger Worker Configuration
 *
 * Controls which platform events get persisted to the audit_logs table.
 *
 * Rules are evaluated top-to-bottom. First match wins.
 * - pattern: glob-style match on event.type ("*" = wildcard)
 * - log: true  → write to DB
 * - log: false → drop silently
 * - stripMeta: fields to remove before saving (e.g. passwords, tokens)
 */

export interface LogRule {
  pattern: string;        // matches event type, supports "*" wildcard
  log: boolean;
  stripMeta?: string[];   // keys to remove from meta before saving
  description?: string;
}

export const LOG_RULES: LogRule[] = [
  // ── Auth ────────────────────────────────────────────────────────────
  { pattern: 'auth.login',          log: true,  description: 'User login' },
  { pattern: 'auth.logout',         log: true,  description: 'User logout' },
  { pattern: 'auth.refresh',        log: false, description: 'Token refresh — too noisy' },

  // ── Flows ────────────────────────────────────────────────────────────
  { pattern: 'flow.create',         log: true },
  { pattern: 'flow.save',           log: true },
  { pattern: 'flow.publish',        log: true },
  { pattern: 'flow.delete',         log: true },

  // ── Approvals ────────────────────────────────────────────────────────
  { pattern: 'approval.submit',     log: true },
  { pattern: 'approval.approved',   log: true },
  { pattern: 'approval.rejected',   log: true },

  // ── User management ──────────────────────────────────────────────────
  { pattern: 'user.create',         log: true,  stripMeta: ['password'] },
  { pattern: 'user.update',         log: true,  stripMeta: ['password'] },
  { pattern: 'user.delete',         log: true },

  // ── Roles ─────────────────────────────────────────────────────────────
  { pattern: 'role.create',         log: true },
  { pattern: 'role.delete',         log: true },

  // ── Catch-all: log everything else not explicitly matched ─────────────
  { pattern: '*',                   log: true,  description: 'Catch-all' },
];

/** Resolve the first matching rule for a given event type */
export function resolveRule(eventType: string): LogRule {
  for (const rule of LOG_RULES) {
    if (rule.pattern === '*') return rule;
    if (rule.pattern === eventType) return rule;
    // simple prefix wildcard: "flow.*"
    if (rule.pattern.endsWith('.*') && eventType.startsWith(rule.pattern.slice(0, -2))) return rule;
  }
  return { pattern: '*', log: true }; // default: log
}
