/**
 * Simple keyword-blocklist content moderator.
 *
 * Uses substring matching so multi-word phrases like "shut up", "buy now at"
 * and "limited time offer" are caught regardless of word boundaries.
 *
 * Severity tiers:
 *   BLOCK  → auto-reject (score 1.0)
 *   HIGH   → flag for manual review (score 0.8)
 *   MEDIUM → warn (score 0.4)
 *
 * Scores are additive and clamped to 1.0. Any BLOCK hit immediately caps at 1.0.
 *
 * BullMQ threshold: score >= 0.7 → auto-reject (answer stays PENDING in queue).
 */

type Severity = 'BLOCK' | 'HIGH' | 'MEDIUM';

const BLOCKLISTS: Record<Severity, string[]> = {
  BLOCK: [
    // Profanity / slurs — customise to your content guidelines
    'idiotic', 'moron',
    // Spam / advertising
    'buy now at', 'click here to win', 'limited time offer',
    // Contact info sharing (uncomment if you want to block these)
    // 'whatsapp me at', 'telegram @', 'discord.gg/',
  ],

  HIGH: [
    'shut up', 'you are stupid', 'you suck',
    "don't trust the internet", 'ignore all advice',
  ],

  MEDIUM: [
    'idk', 'figure it out yourself', 'just google it',
    'get drunk', 'party all night',
  ],
};

const SEVERITY_SCORE: Record<Severity, number> = {
  BLOCK: 1.0,
  HIGH: 0.8,
  MEDIUM: 0.4,
};

// BullMQ auto-rejects at this threshold.
// 1.0 (BLOCK)     → auto-reject + permanent delete
// 0.8 (HIGH)      → auto-reject answer but keep in queue for admin awareness
// < 0.8 (MEDIUM)  → flag only, stays PENDING in admin queue
export const REJECT_THRESHOLD = 0.95;

/** Normalise text: lower-case and strip URLs for consistent matching. */
function normalise(text: string): string {
  return text.toLowerCase().replace(/https?:\/\/\S+/g, '');
}

/**
 * Check if any phrase from a given severity blocklist appears in the text.
 * Returns the first matching phrase, or null.
 */
function findHit(text: string, severity: Severity): string | null {
  const lower = normalise(text);
  for (const phrase of BLOCKLISTS[severity]) {
    if (lower.includes(phrase)) return phrase;
  }
  return null;
}

export interface ModerationResult {
  score: number;          // 0.0 – 1.0
  action: 'approve' | 'reject' | 'flag';
  hits: string[];         // matched phrases
}

/** Main entry point — call from BullMQ worker or inline. */
export async function moderate(
  text: string,
  context?: { title?: string; body?: string }
): Promise<ModerationResult> {
  // Combine answer body + question context for richer checking
  const combined = [text, context?.title, context?.body]
    .filter(Boolean)
    .join(' ');

  const hits: string[] = [];
  let hasBlockHit = false;
  let hasHighHit = false;
  let mediumHitCount = 0;

  for (const severity of (['BLOCK', 'HIGH', 'MEDIUM'] as Severity[])) {
    let hit: string | null;
    let remaining = combined;
    while ((hit = findHit(remaining, severity)) !== null) {
      hits.push(hit);
      if (severity === 'BLOCK') { hasBlockHit = true; break; }
      if (severity === 'HIGH')  hasHighHit = true;
      if (severity === 'MEDIUM') mediumHitCount++;
      const idx = normalise(remaining).indexOf(hit);
      remaining = remaining.slice(idx + hit.length);
    }
    if (hasBlockHit) break;
  }

  // Score: BLOCK = 1.0, HIGH = 0.8, MEDIUM accumulation capped at 0.5
  // Scoring: BLOCK=1.0, HIGH=0.8, multiple MEDIUM hits accumulate (max 0.5)
  // Action thresholds:
  //   score >= 0.95 (only BLOCK can reach this) → auto-reject + delete
  //   score >= 0.70 (HIGH hits)                 → auto-reject but keep in queue for admin review
  //   score <  0.70 (MEDIUM / flags)            → flag for admin review
  //
  // Rationale: auto-reject means BullMQ deletes it; flag means PENDING in admin queue.
  // For safety, only clear profanity/spam hits auto-reject. Borderline content always
  // reaches the admin queue.
  let score = 0;
  if (hasBlockHit)        score = 1.0;
  else if (hasHighHit)    score = 0.8;
  else if (mediumHitCount > 0) score = Math.min(mediumHitCount * 0.2, 0.5);

  let action: ModerationResult['action'] = 'approve';
  if (score >= REJECT_THRESHOLD) action = 'reject';
  else if (hits.length > 0)       action = 'flag';

  return { score, action, hits };
}

/** Convenience: moderate an answer body in isolation. */
export async function moderateAnswer(body: string): Promise<ModerationResult> {
  return moderate(body);
}