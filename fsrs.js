// FSRS-5 Spaced Repetition Scheduler + Stratified Random Quiz Session Builder
// Ratings: 1 = Missed/Revealed (Again), 2 = Hesitated/1-Miss (Hard), 3 = Clean First-Tap (Good)

const W = [
  0.40255,  // w0: initial stability for Again
  1.18385,  // w1: initial stability for Hard
  3.173,    // w2: initial stability for Good
  15.69105, // w3: initial stability for Easy (reference for D0(4))
  7.1949,   // w4: initial difficulty base
  0.5345,   // w5: initial difficulty exponent
  1.4604,   // w6: difficulty delta factor
  0.0046,   // w7: difficulty mean reversion weight
  1.54575,  // w8: recall stability gain base
  0.1192,   // w9: recall stability saturation exponent
  1.01925,  // w10: recall retrievability exponent
  1.9395,   // w11: forget stability base
  0.11,     // w12: forget difficulty exponent
  0.29605,  // w13: forget stability exponent
  2.2698,   // w14: forget retrievability exponent
  0.2315,   // w15: Hard penalty multiplier
  2.9898,   // w16: Easy bonus
  0.51655,  // w17: short-term (same-day) stability factor
  0.6621    // w18: short-term rating offset
];

const DECAY = -0.5;
const FACTOR = 19 / 81;
const REQUEST_RETENTION = 0.90;
const DAY_MS = 86_400_000;
const AGAIN_RELEARN_MS = 8 * 60 * 1000;

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function initDifficulty(rating) {
  return clamp(W[4] - Math.exp(W[5] * (rating - 1)) + 1, 1, 10);
}

function nextDifficulty(d, rating) {
  const deltaD = -W[6] * (rating - 3);
  const damped = d + deltaD * ((10 - d) / 9);
  const d0Easy = initDifficulty(4);
  return clamp(W[7] * d0Easy + (1 - W[7]) * damped, 1, 10);
}

export function getRetrievability(card, now = Date.now()) {
  if (!card.reps || !card.stability || !card.lastReviewAt) {
    return 0;
  }
  const elapsedDays = Math.max(0, (now - card.lastReviewAt) / DAY_MS);
  return Math.pow(1 + FACTOR * (elapsedDays / card.stability), DECAY);
}

function stabilityToIntervalDays(stability) {
  const raw = (stability / FACTOR) * (Math.pow(REQUEST_RETENTION, 1 / DECAY) - 1);
  return Math.max(0.05, raw);
}

export function reviewCard(card, rating, now = Date.now()) {
  const reps = card.reps || 0;
  let stability = card.stability || 0;
  let difficulty = card.difficulty || 0;
  let lapses = card.lapses || 0;

  if (reps === 0) {
    stability = W[rating - 1];
    difficulty = initDifficulty(rating);
    if (rating === 1) lapses += 1;
  } else {
    const elapsedDays = Math.max(0, (now - (card.lastReviewAt || now)) / DAY_MS);
    difficulty = nextDifficulty(difficulty, rating);

    if (elapsedDays < 1) {
      const sNew = stability * Math.exp(W[17] * (rating - 3 + W[18]));
      stability = rating === 1 ? Math.min(stability, Math.max(0.1, sNew)) : Math.max(0.1, sNew);
      if (rating === 1) lapses += 1;
    } else {
      const r = getRetrievability(card, now);
      if (rating === 1) {
        lapses += 1;
        const sForget =
          W[11] *
          Math.pow(difficulty, -W[12]) *
          (Math.pow(stability + 1, W[13]) - 1) *
          Math.exp(W[14] * (1 - r));
        stability = clamp(sForget, 0.1, stability);
      } else {
        const hardPenalty = rating === 2 ? W[15] : 1;
        const gain =
          Math.exp(W[8]) *
          (11 - difficulty) *
          Math.pow(stability, -W[9]) *
          (Math.exp(W[10] * (1 - r)) - 1) *
          hardPenalty;
        stability = Math.max(0.1, stability * (1 + gain));
      }
    }
  }

  const dueAt =
    rating === 1
      ? now + AGAIN_RELEARN_MS
      : now + stabilityToIntervalDays(stability) * DAY_MS;

  return {
    ...card,
    stability: Number(stability.toFixed(4)),
    difficulty: Number(difficulty.toFixed(4)),
    reps: reps + 1,
    lapses,
    lastReviewAt: now,
    dueAt: Math.round(dueAt)
  };
}

export function getMasteryScore(card, now = Date.now()) {
  if (!card.reps || !card.stability) {
    return 0.03;
  }
  const r = getRetrievability(card, now);
  const effectiveStability = card.stability * r;
  const normalized = Math.log1p(effectiveStability) / Math.log1p(60);
  return clamp(0.06 + 0.91 * normalized, 0.04, 0.98);
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function selectFromPool(pool, count, now) {
  if (!pool.length || count <= 0) return [];
  const target = Math.min(count, pool.length);

  const unseen = [];
  const due = [];
  const ahead = [];

  for (const c of pool) {
    if (!c.reps) unseen.push(c);
    else if ((c.dueAt || 0) <= now) due.push(c);
    else ahead.push(c);
  }

  const shufUnseen = shuffle(unseen);
  due.sort((a, b) => getRetrievability(a, now) - getRetrievability(b, now));
  ahead.sort((a, b) => getRetrievability(a, now) - getRetrievability(b, now));

  const picked = [];
  // Prioritize due cards (up to ~65%), then unseen, then backfill
  const dueQuota = Math.min(Math.ceil(target * 0.65), due.length);
  picked.push(...due.slice(0, dueQuota));

  const newQuota = Math.min(target - picked.length, shufUnseen.length);
  picked.push(...shufUnseen.slice(0, newQuota));

  let remDue = dueQuota;
  while (picked.length < target && remDue < due.length) {
    picked.push(due[remDue++]);
  }
  let remNew = newQuota;
  while (picked.length < target && remNew < shufUnseen.length) {
    picked.push(shufUnseen[remNew++]);
  }
  let remAhead = 0;
  while (picked.length < target && remAhead < ahead.length) {
    picked.push(ahead[remAhead++]);
  }

  return picked;
}

/**
 * Builds a randomized quiz session.
 * - If `category` is null ('mixed'), stratifies across all 8 categories (or 7 if `includeEar === false`).
 * - If `category` is specified, draws `sessionSize` drills from that category.
 */
export function buildQuizSession(
  allCards,
  { category = null, sessionSize = 16, now = Date.now() } = {}
) {
  if (!allCards.length) return [];

  if (category) {
    const filtered = allCards.filter((c) => c.category === category);
    return shuffle(selectFromPool(filtered, sessionSize, now));
  }

  const categories = [
    'notes',
    'degrees',
    'intervals',
    'clef',
    'chords',
    'bass',
    'fretboard',
    'neckplay'
  ];

  const perCatBase = Math.floor(sessionSize / categories.length);
  let remainder = sessionSize - perCatBase * categories.length;
  const catOrder = shuffle(categories);

  const selected = [];
  const usedIds = new Set();

  for (const cat of catOrder) {
    const quota = perCatBase + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    const pool = allCards.filter((c) => c.category === cat);
    const chunk = selectFromPool(pool, quota, now);
    for (const c of chunk) {
      selected.push(c);
      usedIds.add(c.id);
    }
  }

  if (selected.length < Math.min(sessionSize, allCards.length)) {
    const leftover = allCards.filter((c) => !usedIds.has(c.id));
    const fill = selectFromPool(leftover, sessionSize - selected.length, now);
    selected.push(...fill);
  }

  return shuffle(selected);
}
