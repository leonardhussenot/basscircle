// Complete Circle-of-Fifths & Bassist Quiz Curriculum + Dynamic Question Generator

import {
  CIRCLE_POSITIONS,
  INTERVALS,
  OFFSET_TO_DEGREE,
  mod,
  posToPitchClass,
  formatSpelledNote,
  formatChord,
  toPracticalEnharmonic,
  getStandardNodeLabel,
  getCanonicalNoteName,
  chooseBestRootSpelling,
  spellInterval,
  getBassFretInfo,
  formatCircleStepDelta
} from './theory.js';

export const QUIZ_CATEGORIES = [
  { id: 'notes', label: 'Notes', desc: 'Place notes on blank circle' },
  { id: 'degrees', label: 'Degrees', desc: 'Place 1–7 & flats on blank circle' },
  { id: 'intervals', label: 'Intervals', desc: '3rd, ♭3, 5th, ♭7 of note or degree' },
  { id: 'relatives', label: 'Relatives', desc: 'Relative minor/major & key sigs' },
  { id: 'bass', label: 'Grooves', desc: 'm7, Dom7, ii–V–I, tritone & penta' },
  { id: 'fretboard', label: 'Neck', desc: '4-string bass fretboard ↔ circle' }
];

function createRng(seed = Date.now()) {
  let a = (seed >>> 0) || 1;
  return function nextRand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rand = Math.random) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function bassMidiForPos(pos, baseMidi = 36) {
  const pc = posToPitchClass(pos);
  const basePc = mod(baseMidi, 12);
  let diff = pc - basePc;
  if (diff < 0) diff += 12;
  return baseMidi + diff;
}

/**
 * Builds the canonical deck definition (~255 cards).
 * Each entry has `{ id, category, kind, params }`.
 */
export function buildCanonicalDeckDefinitions() {
  const defs = [];

  // --- 1. NOTES ON BLANK CIRCLE ---
  // 1A. Spot-place each of the 11 non-Do positions with Do anchored at 12:00
  for (let pos = 1; pos <= 11; pos++) {
    defs.push({
      id: `notes_spot_${pos}`,
      category: 'notes',
      kind: 'note_spot',
      params: { targetPos: pos, preferFlat: pos === 6 ? false : false }
    });
  }
  defs.push({
    id: 'notes_spot_6_flat',
    category: 'notes',
    kind: 'note_spot',
    params: { targetPos: 6, preferFlat: true }
  });

  // 1B. Rotated single-note anchor: 1 note shown at `anchorPos`, place 4 other notes
  for (let anchorPos = 0; anchorPos < 12; anchorPos++) {
    defs.push({
      id: `notes_quad_${anchorPos}`,
      category: 'notes',
      kind: 'note_quad',
      params: { anchorPos }
    });
  }

  // 1C. Sweeps: sharp side, flat side, clockwise 5ths, counter-clockwise 4ths, full shuffled
  defs.push(
    { id: 'notes_sweep_sharps', category: 'notes', kind: 'note_sweep', params: { mode: 'sharps' } },
    { id: 'notes_sweep_flats', category: 'notes', kind: 'note_sweep', params: { mode: 'flats' } },
    { id: 'notes_sweep_fifths', category: 'notes', kind: 'note_sweep', params: { mode: 'fifths' } },
    { id: 'notes_sweep_fourths', category: 'notes', kind: 'note_sweep', params: { mode: 'fourths' } },
    { id: 'notes_sweep_full_shuf', category: 'notes', kind: 'note_sweep', params: { mode: 'random8' } },
    { id: 'notes_sweep_all12', category: 'notes', kind: 'note_sweep', params: { mode: 'all12' } }
  );

  // --- 2. NUMERIC DEGREES ON BLANK CIRCLE ---
  // 2A. Single degree snipe around a randomly rotated `1`
  const degreeTargets = ['5', '4', '2', '6', '3', '7', '♭7', '♭3', '♭6', '♭2', '♭5', '♯4'];
  for (const sym of degreeTargets) {
    defs.push({
      id: `deg_spot_${sym}`,
      category: 'degrees',
      kind: 'deg_spot',
      params: { symbol: sym, showName: true }
    });
  }
  // Pure numeric symbol snipes (no interval hint word) for key degrees
  for (const sym of ['3', '♭3', '4', '5', '6', '♭7', '7', '♭5']) {
    defs.push({
      id: `deg_pure_${sym}`,
      category: 'degrees',
      kind: 'deg_spot',
      params: { symbol: sym, showName: false }
    });
  }

  // 2B. Multi-degree scale & chord sweeps on blank circle around random `1`
  defs.push(
    { id: 'deg_fill_maj_order', category: 'degrees', kind: 'deg_multi', params: { preset: 'maj_order' } },
    { id: 'deg_fill_maj_shuf', category: 'degrees', kind: 'deg_multi', params: { preset: 'maj_shuf' } },
    { id: 'deg_fill_min_order', category: 'degrees', kind: 'deg_multi', params: { preset: 'min_order' } },
    { id: 'deg_fill_min_shuf', category: 'degrees', kind: 'deg_multi', params: { preset: 'min_shuf' } },
    { id: 'deg_fill_dom7', category: 'degrees', kind: 'deg_multi', params: { preset: 'dom7' } },
    { id: 'deg_fill_m7', category: 'degrees', kind: 'deg_multi', params: { preset: 'm7' } },
    { id: 'deg_fill_maj7', category: 'degrees', kind: 'deg_multi', params: { preset: 'maj7' } },
    { id: 'deg_fill_penta_min', category: 'degrees', kind: 'deg_multi', params: { preset: 'penta_min' } },
    { id: 'deg_fill_blues', category: 'degrees', kind: 'deg_multi', params: { preset: 'blues' } },
    { id: 'deg_fill_dorian', category: 'degrees', kind: 'deg_multi', params: { preset: 'dorian' } },
    { id: 'deg_fill_chromatic12', category: 'degrees', kind: 'deg_multi', params: { preset: 'chromatic12' } }
  );

  // --- 3. INTERVALS OF A NOTE & INTERVALS OF A DEGREE ---
  // 3A. Interval of a given Note across all 12 positions
  const coreNoteIntervals = ['3', '♭3', '5', '4', '♭7', '7', '6', '♭5'];
  for (let pos = 0; pos < 12; pos++) {
    for (const sym of coreNoteIntervals) {
      defs.push({
        id: `iv_note_${pos}_${sym}`,
        category: 'intervals',
        kind: 'interval_of_note',
        params: { rootPos: pos, symbol: sym }
      });
    }
  }
  // Extra ♭6 on common minor keys
  for (const pos of [0, 1, 2, 3, 4, 9, 10, 11]) {
    defs.push({
      id: `iv_note_${pos}_b6`,
      category: 'intervals',
      kind: 'interval_of_note',
      params: { rootPos: pos, symbol: '♭6' }
    });
  }

  // 3B. Interval of a given Degree on the Pure Numeric Circle ("major 3rd of a given degree", etc.)
  const compoundDegPairs = [
    { src: '4', iv: '3', result: '6', chordHint: 'IV chord' },
    { src: '5', iv: '3', result: '7', chordHint: 'V chord' },
    { src: '2', iv: '♭3', result: '4', chordHint: 'ii chord' },
    { src: '6', iv: '♭3', result: '1', chordHint: 'vi chord' },
    { src: '3', iv: '♭3', result: '5', chordHint: 'iii chord' },
    { src: '5', iv: '♭7', result: '4', chordHint: 'V7 guide tone' },
    { src: '2', iv: '♭7', result: '1', chordHint: 'ii7 chord' },
    { src: '6', iv: '♭7', result: '5', chordHint: 'vi7 chord' },
    { src: '4', iv: '7', result: '3', chordHint: 'IVmaj7 chord' },
    { src: '5', iv: '5', result: '2', chordHint: 'V chord' },
    { src: '2', iv: '5', result: '6', chordHint: 'ii chord' },
    { src: '6', iv: '5', result: '3', chordHint: 'vi chord' },
    { src: '2', iv: '3', result: '♯4', chordHint: 'II7 (V/V)' },
    { src: '♭7', iv: '3', result: '2', chordHint: '♭VII chord' },
    { src: '♭6', iv: '3', result: '1', chordHint: '♭VI chord' },
    { src: '♭3', iv: '3', result: '5', chordHint: '♭III chord' },
    { src: '7', iv: '♭5', result: '4', chordHint: 'vii° diminished 5th' },
    { src: '3', iv: '3', result: '♯5', skip: true }
  ].filter((x) => !x.skip);

  for (const pair of compoundDegPairs) {
    defs.push({
      id: `iv_deg_${pair.src}_${pair.iv}`,
      category: 'intervals',
      kind: 'interval_of_degree_numeric',
      params: pair
    });
  }

  // 3C. Interval of a Roman-numeral Degree inside a Concrete Key
  const inKeyDegreeDrills = [
    { keyPos: 0, roman: 'IV', srcSym: '4', iv: '3' },
    { keyPos: 1, roman: 'V', srcSym: '5', iv: '3' },
    { keyPos: 11, roman: 'ii', srcSym: '2', iv: '♭3' },
    { keyPos: 10, roman: 'V7', srcSym: '5', iv: '♭7' },
    { keyPos: 9, roman: 'IV', srcSym: '4', iv: '3' },
    { keyPos: 2, roman: 'vi', srcSym: '6', iv: '♭3' },
    { keyPos: 3, roman: 'V', srcSym: '5', iv: '3' },
    { keyPos: 8, roman: 'ii', srcSym: '2', iv: '♭3' },
    { keyPos: 4, roman: 'V7', srcSym: '5', iv: '♭7' },
    { keyPos: 0, roman: 'ii', srcSym: '2', iv: '♭7' },
    { keyPos: 1, roman: 'IVmaj7', srcSym: '4', iv: '7' },
    { keyPos: 10, roman: 'vi', srcSym: '6', iv: '5' }
  ];
  for (const item of inKeyDegreeDrills) {
    defs.push({
      id: `iv_inkey_${item.keyPos}_${item.roman}_${item.iv}`,
      category: 'intervals',
      kind: 'interval_of_degree_inkey',
      params: item
    });
  }

  // --- 4. RELATIVES & KEY SIGNATURES ---
  for (let pos = 0; pos < 12; pos++) {
    defs.push({
      id: `rel_min_of_${pos}`,
      category: 'relatives',
      kind: 'rel_minor',
      params: { majorPos: pos, preferFlat: pos === 6 ? false : false }
    });
    defs.push({
      id: `rel_maj_of_${pos}`,
      category: 'relatives',
      kind: 'rel_major',
      params: { minorPos: pos }
    });
  }
  // Key signatures: 1♯..6♯ and 1♭..6♭ (Major) + key Minor signatures
  for (let sharps = 1; sharps <= 6; sharps++) {
    defs.push({
      id: `keysig_maj_s${sharps}`,
      category: 'relatives',
      kind: 'key_sig',
      params: { count: sharps, sign: '♯', mode: 'major', targetPos: sharps }
    });
  }
  for (let flats = 1; flats <= 6; flats++) {
    defs.push({
      id: `keysig_maj_b${flats}`,
      category: 'relatives',
      kind: 'key_sig',
      params: { count: flats, sign: '♭', mode: 'major', targetPos: mod(12 - flats, 12) }
    });
  }
  for (const [count, sign, targetPos] of [
    [0, '', 3],   // La m / Am (0 sharps/flats)
    [1, '♯', 4],  // Mi m / Em
    [2, '♯', 5],  // Si m / Bm
    [3, '♯', 6],  // Fa♯ m / F♯m
    [1, '♭', 2],  // Ré m / Dm
    [2, '♭', 1],  // Sol m / Gm
    [3, '♭', 0],  // Do m / Cm
    [4, '♭', 11]  // Fa m / Fm
  ]) {
    defs.push({
      id: `keysig_min_${sign || '0'}${count}`,
      category: 'relatives',
      kind: 'key_sig',
      params: { count, sign, mode: 'minor', targetPos }
    });
  }

  // --- 5. BASS HARMONY, ARPEGGIOS & TURNAROUNDS ---
  // 5A. 7th Chord Arpeggios across keys
  const arpConfigs = [
    { quality: 'Dom7', suffix: '7', degrees: ['1', '3', '5', '♭7'], keys: [0, 1, 2, 3, 4, 9, 10, 11] },
    { quality: 'm7', suffix: 'm7', degrees: ['1', '♭3', '5', '♭7'], keys: [0, 1, 2, 3, 4, 6, 10, 11] },
    { quality: 'Maj7', suffix: 'Maj7', degrees: ['1', '3', '5', '7'], keys: [0, 1, 8, 9, 10, 11] },
    { quality: 'm7♭5', suffix: 'm7♭5', degrees: ['1', '♭3', '♭5', '♭7'], keys: [4, 5, 6, 11] }
  ];
  for (const cfg of arpConfigs) {
    for (const pos of cfg.keys) {
      defs.push({
        id: `bass_arp_${cfg.quality}_${pos}`,
        category: 'bass',
        kind: 'bass_arpeggio',
        params: { rootPos: pos, quality: cfg.quality, suffix: cfg.suffix, degrees: cfg.degrees }
      });
    }
  }

  // 5B. ii -> V -> I, vi -> ii -> V -> I, and I -> IV -> V bass walks
  for (const pos of [0, 1, 2, 3, 8, 9, 10, 11]) {
    defs.push({
      id: `bass_iiVI_${pos}`,
      category: 'bass',
      kind: 'bass_progression',
      params: { keyPos: pos, prog: 'ii-V-I' }
    });
  }
  for (const pos of [0, 1, 9, 10, 11]) {
    defs.push({
      id: `bass_viiiVI_${pos}`,
      category: 'bass',
      kind: 'bass_progression',
      params: { keyPos: pos, prog: 'vi-ii-V-I' }
    });
  }
  for (const pos of [0, 1, 2, 3, 4, 10, 11]) {
    defs.push({
      id: `bass_I_IV_V_${pos}`,
      category: 'bass',
      kind: 'bass_progression',
      params: { keyPos: pos, prog: 'I-IV-V' }
    });
  }

  // 5C. Tritone Substitution (♭II7 resolving down a half-step to I)
  for (const pos of [0, 1, 9, 10, 11, 2]) {
    defs.push({
      id: `bass_tritonesub_${pos}`,
      category: 'bass',
      kind: 'bass_tritone_sub',
      params: { targetKeyPos: pos }
    });
  }

  // 5D. Minor Pentatonic Bass Pocket (1 -> ♭3 -> 4 -> 5 -> ♭7)
  for (const pos of [0, 1, 2, 3, 4, 6, 10, 11]) {
    defs.push({
      id: `bass_penta_${pos}`,
      category: 'bass',
      kind: 'bass_pentatonic',
      params: { rootPos: pos }
    });
  }

  // 5E. Dom7 Guide Tones (3 -> ♭7 tritone pair) & Dorian Funk Pocket (1 -> ♭3 -> 6 -> ♭7)
  for (const pos of [0, 1, 2, 9, 10, 11]) {
    defs.push({
      id: `bass_guidetones_${pos}`,
      category: 'bass',
      kind: 'bass_guidetones',
      params: { rootPos: pos }
    });
  }
  for (const pos of [0, 1, 2, 3, 4, 11]) {
    defs.push({
      id: `bass_dorian_${pos}`,
      category: 'bass',
      kind: 'bass_arpeggio',
      params: { rootPos: pos, quality: 'Dorian', suffix: ' Dorian', degrees: ['1', '♭3', '6', '♭7'] }
    });
  }

  // --- 6. 4-STRING BASS FRETBOARD <-> CIRCLE ---
  // 6A. Identify bass neck dot directly on the Circle
  const neckPositions = [
    [0, 1], [0, 3], [0, 5], [0, 6], [0, 8], [0, 10], [0, 11], // E / Mi string
    [1, 1], [1, 2], [1, 3], [1, 4], [1, 6], [1, 8], [1, 11], // A / La string
    [2, 1], [2, 3], [2, 4], [2, 6], [2, 8], [2, 9],          // D / Ré string
    [3, 1], [3, 2], [3, 4], [3, 5], [3, 8], [3, 10]          // G / Sol string
  ];
  for (const [sIdx, fret] of neckPositions) {
    defs.push({
      id: `neck_note_s${sIdx}_f${fret}`,
      category: 'fretboard',
      kind: 'neck_to_note',
      params: { stringIndex: sIdx, fret }
    });
  }

  // 6B. Bass neck dot -> tap its harmonic interval on the Circle
  const neckIntervalDrills = [
    { stringIndex: 0, fret: 5, symbol: '3' },   // La -> Do♯
    { stringIndex: 0, fret: 3, symbol: '5' },   // Sol -> Ré
    { stringIndex: 0, fret: 6, symbol: '♭7' },  // Si♭ -> La♭
    { stringIndex: 0, fret: 8, symbol: '♭3' },  // Do -> Mi♭
    { stringIndex: 1, fret: 3, symbol: '3' },   // Do -> Mi
    { stringIndex: 1, fret: 6, symbol: '5' },   // Mi♭ -> Si♭
    { stringIndex: 1, fret: 5, symbol: '♭3' },  // Ré -> Fa
    { stringIndex: 1, fret: 8, symbol: '♭7' },  // Fa -> Mi♭
    { stringIndex: 2, fret: 3, symbol: '3' },   // Fa -> La
    { stringIndex: 2, fret: 5, symbol: '♭7' },  // Sol -> Fa
    { stringIndex: 3, fret: 4, symbol: '♭3' },  // Si -> Ré
    { stringIndex: 3, fret: 5, symbol: '5' }    // Do -> Sol
  ];
  for (const item of neckIntervalDrills) {
    defs.push({
      id: `neck_iv_s${item.stringIndex}_f${item.fret}_${item.symbol}`,
      category: 'fretboard',
      kind: 'neck_to_interval',
      params: item
    });
  }

  return defs;
}

const DECK_MAP = new Map(
  buildCanonicalDeckDefinitions().map((d) => [d.id, d])
);

export function getDefinitionById(id) {
  return DECK_MAP.get(id) || null;
}

function makeLabeledNoteNodes(notation, highlightMap = {}) {
  return Array.from({ length: 12 }, (_, pos) => {
    const std = getStandardNodeLabel(pos, notation);
    const hl = highlightMap[pos] || {};
    return {
      pos,
      mode: hl.mode || 'labeled',
      primary: hl.primary !== undefined ? hl.primary : std.primary,
      secondary: hl.secondary !== undefined ? hl.secondary : std.secondary,
      subBadge: hl.subBadge || '',
      wrongFlashLabel: std.primary
    };
  });
}

function makeBlankNoteNodes(notation, visiblePositions = [0]) {
  const visSet = new Set(visiblePositions);
  return Array.from({ length: 12 }, (_, pos) => {
    const std = getStandardNodeLabel(pos, notation);
    const isVis = visSet.has(pos);
    return {
      pos,
      mode: isVis ? 'anchor' : 'blank',
      primary: isVis ? std.primary : '',
      secondary: isVis ? std.secondary : '',
      subBadge: isVis && pos === 0 ? '12h' : '',
      wrongFlashLabel: std.primary
    };
  });
}

function makeBlankDegreeNodes(rootPos) {
  return Array.from({ length: 12 }, (_, pos) => {
    const offset = mod(pos - rootPos, 12);
    const deg = OFFSET_TO_DEGREE[offset];
    const isRoot = offset === 0;
    return {
      pos,
      mode: isRoot ? 'anchor' : 'blank',
      primary: isRoot ? '1' : '',
      secondary: '',
      subBadge: '',
      wrongFlashLabel: deg
    };
  });
}

function makeLabeledDegreeNodes(rootPos, sourcePos = null) {
  return Array.from({ length: 12 }, (_, pos) => {
    const offset = mod(pos - rootPos, 12);
    const deg = OFFSET_TO_DEGREE[offset];
    let mode = 'labeled';
    if (pos === rootPos) mode = 'anchor';
    if (sourcePos !== null && pos === sourcePos) mode = 'source';
    return {
      pos,
      mode,
      primary: deg,
      secondary: offset === 6 ? '♯4' : '',
      subBadge: pos === rootPos ? 'root' : '',
      wrongFlashLabel: deg
    };
  });
}

/**
 * Instantiates a live, interactive Circle-of-Fifths question from a stored card.
 */
export function instantiateQuiz(card, notation = 'solfege', seed = null) {
  const def = DECK_MAP.get(card.id);
  if (!def) {
    throw new Error(`Unknown card definition: ${card.id}`);
  }
  const rand = seed !== null ? createRng(seed) : Math.random;
  const { kind, params } = def;

  // 1A. Spot-place a single note on blank Circle (Do anchored at 12:00)
  if (kind === 'note_spot') {
    const { targetPos, preferFlat } = params;
    const noteName = getCanonicalNoteName(targetPos, notation, preferFlat);
    const doName = getCanonicalNoteName(0, notation);
    const nodes = makeBlankNoteNodes(notation, [0]);
    const stepDelta = formatCircleStepDelta(targetPos);

    return {
      id: card.id,
      category: 'notes',
      eyebrow: 'BLANK CIRCLE · NOTES',
      promptHtml: `Place <b>${noteName}</b> on the Circle`,
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos,
          centerLabel: noteName,
          centerSub: 'Tap position',
          stepChipLabel: noteName,
          revealedPrimary: noteName,
          revealedSub: '',
          midiToPlay: bassMidiForPos(targetPos, 36)
        }
      ],
      geometry: { type: 'arc', fromPos: 0, toPos: targetPos },
      doneCenterPrimary: noteName,
      doneCenterSub: stepDelta,
      explanation: `${noteName} is ${stepDelta} from ${doName}.`
    };
  }

  // 1B. Place 4 notes relative to a single rotated anchor note
  if (kind === 'note_quad') {
    const { anchorPos } = params;
    const anchorName = getCanonicalNoteName(anchorPos, notation);
    const nodes = makeBlankNoteNodes(notation, [anchorPos]);
    const pool = [];
    for (let p = 0; p < 12; p++) {
      if (p !== anchorPos) pool.push(p);
    }
    const picked = shuffle(pool, rand).slice(0, 4);
    const steps = picked.map((p, idx) => {
      const nm = getCanonicalNoteName(p, notation);
      return {
        targetPos: p,
        centerLabel: nm,
        centerSub: `${idx + 1} / 4`,
        stepChipLabel: nm,
        revealedPrimary: nm,
        revealedSub: '',
        midiToPlay: bassMidiForPos(p, 36)
      };
    });

    return {
      id: card.id,
      category: 'notes',
      eyebrow: 'BLANK CIRCLE · ANCHOR',
      promptHtml: `Anchored on <b>${anchorName}</b> · place 4 notes`,
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'polygon', positions: [anchorPos, ...picked] },
      doneCenterPrimary: '4 / 4',
      doneCenterSub: `from ${anchorName}`,
      explanation: `Clockwise = +5th, counter-clockwise = +4th from ${anchorName}.`
    };
  }

  // 1C. Multi-note sweep on blank Circle
  if (kind === 'note_sweep') {
    const { mode } = params;
    const nodes = makeBlankNoteNodes(notation, [0]);
    let seq = [];
    let title = '';
    if (mode === 'sharps') {
      seq = shuffle([1, 2, 3, 4, 5, 6], rand);
      title = 'Place the <b>6 sharp-side</b> notes';
    } else if (mode === 'flats') {
      seq = shuffle([11, 10, 9, 8, 7, 6], rand);
      title = 'Place the <b>6 flat-side</b> notes';
    } else if (mode === 'fifths') {
      seq = [1, 2, 3, 4, 5, 6];
      title = 'Walk <b>clockwise in 5ths</b> (6 steps)';
    } else if (mode === 'fourths') {
      seq = [11, 10, 9, 8, 7, 6];
      title = 'Walk <b>CCW in 4ths</b> (6 steps)';
    } else if (mode === 'all12') {
      seq = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], rand);
      title = 'Fill <b>all 12 notes</b> around the Circle';
    } else {
      seq = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], rand).slice(0, 8);
      title = 'Fill <b>8 random notes</b> around the Circle';
    }
    const preferFlat = mode === 'flats' || mode === 'fourths';
    const steps = seq.map((p, idx) => {
      const nm = getCanonicalNoteName(p, notation, preferFlat && p === 6);
      return {
        targetPos: p,
        centerLabel: nm,
        centerSub: `${idx + 1} / ${seq.length}`,
        stepChipLabel: nm,
        revealedPrimary: nm,
        revealedSub: '',
        midiToPlay: bassMidiForPos(p, 36)
      };
    });

    return {
      id: card.id,
      category: 'notes',
      eyebrow: 'FILL THE CIRCLE · NOTES',
      promptHtml: title,
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'walk', positions: [0, ...seq] },
      doneCenterPrimary: `${seq.length} / ${seq.length}`,
      doneCenterSub: 'Circle mapped',
      explanation: 'Right half = sharps (+5ths CW), left half = flats (+4ths CCW).'
    };
  }

  // 2A. Single numeric degree on blank Circle (1 at random clock position!)
  if (kind === 'deg_spot') {
    const { symbol, showName } = params;
    const iv = INTERVALS[symbol];
    const rootPos = Math.floor(rand() * 12);
    const targetPos = mod(rootPos + iv.circleOffset, 12);
    const nodes = makeBlankDegreeNodes(rootPos);
    const stepDelta = formatCircleStepDelta(iv.circleOffset);

    const promptHtml = showName
      ? `Place degree <b>${symbol}</b> <span class="q-sub">(${iv.name})</span>`
      : `Place degree <b>${symbol}</b> relative to <b>1</b>`;

    return {
      id: card.id,
      category: 'degrees',
      eyebrow: 'BLANK CIRCLE · DEGREES',
      promptHtml,
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos,
          centerLabel: symbol,
          centerSub: 'from 1',
          stepChipLabel: symbol,
          revealedPrimary: symbol,
          revealedSub: '',
          midiToPlay: 36 + iv.semitones
        }
      ],
      geometry: { type: 'arc', fromPos: rootPos, toPos: targetPos },
      doneCenterPrimary: symbol,
      doneCenterSub: stepDelta,
      explanation: `Degree ${symbol} (${iv.name}) is always ${stepDelta} from 1.`
    };
  }

  // 2B. Multi-degree scale / chord fill on blank Circle around random `1`
  if (kind === 'deg_multi') {
    const { preset } = params;
    const rootPos = Math.floor(rand() * 12);
    const nodes = makeBlankDegreeNodes(rootPos);

    let degList = [];
    let title = '';
    let takeaway = '';

    if (preset === 'maj_order') {
      degList = ['2', '3', '4', '5', '6', '7'];
      title = 'Place <b>Major Scale</b> degrees <span class="q-sub">(2 → 7)</span>';
      takeaway = 'Major scale forms 7 contiguous slices: 4 (CCW) through 7 (+5 CW).';
    } else if (preset === 'maj_shuf') {
      degList = shuffle(['2', '3', '4', '5', '6', '7'], rand);
      title = 'Place shuffled <b>Major</b> degrees';
      takeaway = '4 = −1 CCW, 5 = +1, 2 = +2, 6 = +3, 3 = +4, 7 = +5 CW.';
    } else if (preset === 'min_order') {
      degList = ['2', '♭3', '4', '5', '♭6', '♭7'];
      title = 'Place <b>Natural Minor</b> degrees';
      takeaway = 'Natural minor forms 7 contiguous slices from ♭6 (−4 CCW) to 2 (+2 CW).';
    } else if (preset === 'min_shuf') {
      degList = shuffle(['2', '♭3', '4', '5', '♭6', '♭7'], rand);
      title = 'Place shuffled <b>Minor</b> degrees';
      takeaway = '♭3 = −3 CCW, ♭6 = −4 CCW, ♭7 = −2 CCW.';
    } else if (preset === 'dom7') {
      degList = ['3', '5', '♭7'];
      title = 'Place <b>Dom7</b> degrees <span class="q-sub">(3 · 5 · ♭7)</span>';
      takeaway = 'Dom7 combines +4 CW (3), +1 CW (5), and −2 CCW (♭7) — a tritone between 3 & ♭7.';
    } else if (preset === 'm7') {
      degList = ['♭3', '5', '♭7'];
      title = 'Place <b>Minor 7th</b> degrees <span class="q-sub">(♭3 · 5 · ♭7)</span>';
      takeaway = 'm7: ♭3 (−3 CCW), 5 (+1 CW), ♭7 (−2 CCW).';
    } else if (preset === 'maj7') {
      degList = ['3', '5', '7'];
      title = 'Place <b>Maj7</b> degrees <span class="q-sub">(3 · 5 · 7)</span>';
      takeaway = 'Maj7 lives entirely on the clockwise side: 1, 5 (+1), 3 (+4), 7 (+5).';
    } else if (preset === 'penta_min') {
      degList = ['♭3', '4', '5', '♭7'];
      title = 'Place <b>Minor Pentatonic</b> degrees';
      takeaway = 'Minor pentatonic is 5 adjacent slices: ♭3, ♭7, 4, 1, 5!';
    } else if (preset === 'dorian') {
      degList = shuffle(['2', '♭3', '4', '5', '6', '♭7'], rand);
      title = 'Place <b>Dorian</b> funk degrees';
      takeaway = 'Dorian is mirror-symmetric around 1: −3 (♭3) through +3 (6)!';
    } else if (preset === 'chromatic12') {
      degList = shuffle(['♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'], rand);
      title = 'Fill <b>all 12 chromatic</b> degrees';
      takeaway = 'Every chromatic interval has a fixed geometric address relative to 1.';
    } else {
      degList = ['♭3', '3', '4', '♭5', '5', '♭7'];
      title = 'Place <b>Funk / Blues</b> degrees';
      takeaway = '♭5 sits directly opposite 1 (6 steps); ♭3 is −3 CCW, 3 is +4 CW.';
    }

    const steps = degList.map((sym, idx) => {
      const iv = INTERVALS[sym];
      const tPos = mod(rootPos + iv.circleOffset, 12);
      return {
        targetPos: tPos,
        centerLabel: sym,
        centerSub: `${idx + 1} / ${degList.length}`,
        stepChipLabel: sym,
        revealedPrimary: sym,
        revealedSub: '',
        midiToPlay: 36 + iv.semitones
      };
    });

    return {
      id: card.id,
      category: 'degrees',
      eyebrow: 'BLANK CIRCLE · DEGREES',
      promptHtml: title,
      fretboard: null,
      nodes,
      steps,
      geometry: {
        type: 'polygon',
        positions: [rootPos, ...steps.map((s) => s.targetPos)]
      },
      doneCenterPrimary: '✓',
      doneCenterSub: `${degList.length} degrees`,
      explanation: takeaway
    };
  }

  // 3A. Interval of a given Note
  if (kind === 'interval_of_note') {
    const { rootPos, symbol } = params;
    const iv = INTERVALS[symbol];
    const rootSpelled = chooseBestRootSpelling(rootPos, [symbol]);
    const rawTarget = spellInterval(rootSpelled, symbol);
    const targetSpelled = symbol === '♭5' ? toPracticalEnharmonic(rawTarget) : rawTarget;
    const rootName = formatSpelledNote(rootSpelled, notation);
    const targetName = formatSpelledNote(targetSpelled, notation);
    const targetPos = targetSpelled.pos;

    const nodes = makeLabeledNoteNodes(notation, {
      [rootPos]: { mode: 'anchor', primary: rootName, secondary: '', subBadge: '1' }
    });
    const stepDelta = formatCircleStepDelta(iv.circleOffset);

    return {
      id: card.id,
      category: 'intervals',
      eyebrow: 'INTERVAL OF A NOTE',
      promptHtml: `${iv.name} <span class="q-badge">${symbol}</span> of <b>${rootName}</b>`,
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos,
          centerLabel: symbol,
          centerSub: `of ${rootName}`,
          stepChipLabel: symbol,
          revealedPrimary: targetName,
          revealedSub: symbol,
          midiToPlay: bassMidiForPos(rootPos, 36) + iv.semitones
        }
      ],
      rootMidiPreview: bassMidiForPos(rootPos, 36),
      geometry: { type: 'arc', fromPos: rootPos, toPos: targetPos },
      doneCenterPrimary: targetName,
      doneCenterSub: stepDelta,
      explanation: `${iv.name} (${symbol}) of ${rootName} is ${targetName} (${stepDelta}).`
    };
  }

  // 3B. Interval of a given Degree on the Pure Numeric Circle
  if (kind === 'interval_of_degree_numeric') {
    const { src, iv: ivSym, result, chordHint } = params;
    const srcIv = INTERVALS[src];
    const hopIv = INTERVALS[ivSym];
    const rootPos = Math.floor(rand() * 12);
    const srcPos = mod(rootPos + srcIv.circleOffset, 12);
    const targetPos = mod(srcPos + hopIv.circleOffset, 12);
    const nodes = makeLabeledDegreeNodes(rootPos, srcPos);
    const hopDelta = formatCircleStepDelta(hopIv.circleOffset);

    return {
      id: card.id,
      category: 'intervals',
      eyebrow: 'DEGREE HARMONY',
      promptHtml: `${hopIv.name} <span class="q-badge">${ivSym}</span> of degree <b>${src}</b>`,
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos,
          centerLabel: `${ivSym} of ${src}`,
          centerSub: chordHint,
          stepChipLabel: result,
          revealedPrimary: result,
          revealedSub: `${ivSym} of ${src}`,
          midiToPlay: 36 + mod(srcIv.semitones + hopIv.semitones, 12)
        }
      ],
      geometry: { type: 'two-hop', fromPos: rootPos, midPos: srcPos, toPos: targetPos },
      doneCenterPrimary: result,
      doneCenterSub: hopDelta,
      explanation: `Degree ${src} (${chordHint}) + ${hopIv.name} (${hopDelta}) lands on degree ${result}.`
    };
  }

  // 3C. Interval of a Degree inside a Concrete Key
  if (kind === 'interval_of_degree_inkey') {
    const { keyPos, roman, srcSym, iv: ivSym } = params;
    const srcIv = INTERVALS[srcSym];
    const hopIv = INTERVALS[ivSym];

    const keySpelled = chooseBestRootSpelling(keyPos, [srcSym]);
    const chordRootSpelled = spellInterval(keySpelled, srcSym);
    const targetSpelled = spellInterval(chordRootSpelled, ivSym);

    const keyName = formatSpelledNote(keySpelled, notation);
    const chordRootName = formatSpelledNote(chordRootSpelled, notation);
    const targetName = formatSpelledNote(targetSpelled, notation);
    const srcPos = chordRootSpelled.pos;
    const targetPos = targetSpelled.pos;

    const nodes = makeLabeledNoteNodes(notation, {
      [keyPos]: { mode: 'anchor', primary: keyName, secondary: '', subBadge: 'I' }
    });

    return {
      id: card.id,
      category: 'intervals',
      eyebrow: 'IN-KEY CHORD TONE',
      promptHtml: `In <b>${keyName}</b>: ${hopIv.name} <span class="q-badge">${ivSym}</span> of <b>${roman}</b>`,
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos,
          centerLabel: `${ivSym} of ${roman}`,
          centerSub: `Key of ${keyName}`,
          stepChipLabel: targetName,
          revealedPrimary: targetName,
          revealedSub: `${ivSym} of ${chordRootName}`,
          midiToPlay: bassMidiForPos(srcPos, 36) + hopIv.semitones
        }
      ],
      geometry: { type: 'two-hop', fromPos: keyPos, midPos: srcPos, toPos: targetPos },
      doneCenterPrimary: targetName,
      doneCenterSub: `${roman} = ${chordRootName}`,
      explanation: `In ${keyName}, ${roman} is ${chordRootName}; its ${ivSym} is ${targetName}.`
    };
  }

  // 4A. Relative Minor of a Major Key (+3 CW)
  if (kind === 'rel_minor') {
    const { majorPos } = params;
    const rootSpelled = chooseBestRootSpelling(majorPos, ['6']);
    const relMinSpelled = spellInterval(rootSpelled, '6');
    const majName = formatSpelledNote(rootSpelled, notation);
    const minName = formatChord(relMinSpelled, 'm', notation);
    const targetPos = mod(majorPos + 3, 12);

    const nodes = makeLabeledNoteNodes(notation, {
      [majorPos]: { mode: 'anchor', primary: majName, secondary: '', subBadge: 'I' }
    });

    return {
      id: card.id,
      category: 'relatives',
      eyebrow: 'RELATIVE MINOR',
      promptHtml: `Relative minor <span class="q-badge">vi</span> of <b>${majName}</b>`,
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos,
          centerLabel: 'vi',
          centerSub: `of ${majName}`,
          stepChipLabel: 'vi',
          revealedPrimary: minName,
          revealedSub: '+3 CW',
          midiToPlay: bassMidiForPos(targetPos, 36)
        }
      ],
      geometry: { type: 'arc', fromPos: majorPos, toPos: targetPos },
      doneCenterPrimary: minName,
      doneCenterSub: '+3 steps CW',
      explanation: `Relative minor (degree 6) is always +3 steps clockwise: ${majName} → ${minName}.`
    };
  }

  // 4B. Relative Major of a Minor Key (-3 CCW)
  if (kind === 'rel_major') {
    const { minorPos } = params;
    const minSpelled = CIRCLE_POSITIONS[minorPos].minorAtThisPos;
    const majPos = mod(minorPos - 3, 12);
    const majSpelled = spellInterval(minSpelled, '♭3');
    const minLabel = formatChord(minSpelled, 'm', notation);
    const majLabel = formatSpelledNote(majSpelled, notation);

    const nodes = makeLabeledNoteNodes(notation, {
      [minorPos]: { mode: 'anchor', primary: minLabel, secondary: '', subBadge: 'vi' }
    });

    return {
      id: card.id,
      category: 'relatives',
      eyebrow: 'RELATIVE MAJOR',
      promptHtml: `Relative major <span class="q-badge">I</span> of <b>${minLabel}</b>`,
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos: majPos,
          centerLabel: 'I',
          centerSub: `of ${minLabel}`,
          stepChipLabel: 'I',
          revealedPrimary: majLabel,
          revealedSub: '−3 CCW',
          midiToPlay: bassMidiForPos(majPos, 36)
        }
      ],
      geometry: { type: 'arc', fromPos: minorPos, toPos: majPos },
      doneCenterPrimary: majLabel,
      doneCenterSub: '−3 steps CCW',
      explanation: `Relative major (♭3 of minor) is always −3 steps CCW: ${minLabel} → ${majLabel}.`
    };
  }

  // 4C. Key Signature -> Major or Minor Key
  if (kind === 'key_sig') {
    const { count, sign, mode, targetPos } = params;
    const sigText = count === 0 ? '0 ♯ / 0 ♭' : `${count}${sign}`;
    const isMinor = mode === 'minor';

    let answerLabel = '';
    if (isMinor) {
      answerLabel = formatChord(CIRCLE_POSITIONS[targetPos].minorAtThisPos, 'm', notation);
    } else {
      const preferFlat = sign === '♭';
      answerLabel = getCanonicalNoteName(targetPos, notation, preferFlat);
    }

    const nodes = makeLabeledNoteNodes(notation);

    return {
      id: card.id,
      category: 'relatives',
      eyebrow: 'KEY SIGNATURE',
      promptHtml: `Which <b>${isMinor ? 'minor' : 'major'}</b> key has <b>${sigText}</b>?`,
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos,
          centerLabel: sigText,
          centerSub: isMinor ? 'Minor key' : 'Major key',
          stepChipLabel: sigText,
          revealedPrimary: answerLabel,
          revealedSub: sigText,
          midiToPlay: bassMidiForPos(targetPos, 36)
        }
      ],
      geometry: { type: 'arc', fromPos: isMinor ? 3 : 0, toPos: targetPos },
      doneCenterPrimary: answerLabel,
      doneCenterSub: sigText,
      explanation: isMinor
        ? `${answerLabel} has ${sigText} (relative minor sits +3 CW from its ${sigText} major key).`
        : `Each clockwise step adds 1♯; each CCW step adds 1♭ → ${sigText} = ${answerLabel}.`
    };
  }

  // 5A. Bass 7th Chord Arpeggios (1 -> 3/♭3 -> 5/♭5 -> 7/♭7)
  if (kind === 'bass_arpeggio') {
    const { rootPos, quality, suffix, degrees } = params;
    const rootSpelled = chooseBestRootSpelling(rootPos, degrees);
    const chordName = formatChord(rootSpelled, suffix, notation);
    const baseMidi = bassMidiForPos(rootPos, 33);
    const nodes = makeLabeledNoteNodes(notation);

    const steps = degrees.map((degSym) => {
      const iv = INTERVALS[degSym];
      const sp = spellInterval(rootSpelled, degSym);
      const nm = formatSpelledNote(sp, notation);
      return {
        targetPos: sp.pos,
        centerLabel: degSym,
        centerSub: chordName,
        stepChipLabel: degSym,
        revealedPrimary: nm,
        revealedSub: degSym,
        midiToPlay: baseMidi + iv.semitones
      };
    });

    const noteSummary = steps.map((s) => s.revealedPrimary).join(' – ');

    return {
      id: card.id,
      category: 'bass',
      eyebrow: `BASS ARPEGGIO · ${quality.toUpperCase()}`,
      promptHtml: `Outline <b>${chordName}</b>`,
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'polygon', positions: steps.map((s) => s.targetPos) },
      doneCenterPrimary: chordName,
      doneCenterSub: degrees.join('·'),
      explanation: `${chordName}: ${noteSummary}.`
    };
  }

  // 5B. Bass Turnarounds (ii -> V -> I, vi -> ii -> V -> I, I -> IV -> V)
  if (kind === 'bass_progression') {
    const { keyPos, prog } = params;
    let seqSpecs = [];
    if (prog === 'ii-V-I') {
      seqSpecs = [
        { deg: '2', roman: 'ii', qual: 'm7' },
        { deg: '5', roman: 'V', qual: '7' },
        { deg: '1', roman: 'I', qual: 'Maj7' }
      ];
    } else if (prog === 'vi-ii-V-I') {
      seqSpecs = [
        { deg: '6', roman: 'vi', qual: 'm7' },
        { deg: '2', roman: 'ii', qual: 'm7' },
        { deg: '5', roman: 'V', qual: '7' },
        { deg: '1', roman: 'I', qual: 'Maj7' }
      ];
    } else {
      seqSpecs = [
        { deg: '1', roman: 'I', qual: '' },
        { deg: '4', roman: 'IV', qual: '' },
        { deg: '5', roman: 'V', qual: '' }
      ];
    }

    const rootSpelled = chooseBestRootSpelling(
      keyPos,
      seqSpecs.map((s) => s.deg)
    );
    const keyName = formatSpelledNote(rootSpelled, notation);
    const nodes = makeLabeledNoteNodes(notation, {
      [keyPos]: { mode: 'source', primary: keyName, secondary: '', subBadge: 'Key' }
    });

    const steps = seqSpecs.map((item) => {
      const sp = spellInterval(rootSpelled, item.deg);
      const noteOnly = formatSpelledNote(sp, notation);
      return {
        targetPos: sp.pos,
        centerLabel: item.roman,
        centerSub: `in ${keyName}`,
        stepChipLabel: item.roman,
        revealedPrimary: noteOnly,
        revealedSecondary: item.qual,
        fullChordLabel: formatChord(sp, item.qual, notation),
        revealedSub: item.roman,
        midiToPlay: bassMidiForPos(sp.pos, 34)
      };
    });

    const walkStr = steps.map((s) => s.fullChordLabel).join(' → ');

    return {
      id: card.id,
      category: 'bass',
      eyebrow: 'BASS TURNAROUND',
      promptHtml: `Walk <b>${prog.replace(/-/g, ' → ')}</b> in <b>${keyName}</b>`,
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'walk', positions: steps.map((s) => s.targetPos) },
      doneCenterPrimary: prog,
      doneCenterSub: keyName,
      explanation:
        prog === 'I-IV-V'
          ? `I–IV–V hugs ${keyName} and its two immediate Circle neighbors: ${walkStr}.`
          : `${prog} walks step-by-step counter-clockwise home to ${keyName}: ${walkStr}.`
    };
  }

  // 5C. Tritone Substitution (♭II7 resolving to I)
  if (kind === 'bass_tritone_sub') {
    const { targetKeyPos } = params;
    const keySpelled = chooseBestRootSpelling(targetKeyPos, ['5', '♭2']);
    const domSpelled = spellInterval(keySpelled, '5');
    const subSpelled = toPracticalEnharmonic(spellInterval(keySpelled, '♭2'));
    const keyName = formatSpelledNote(keySpelled, notation);
    const domName = formatChord(domSpelled, '7', notation);
    const subName = formatChord(subSpelled, '7', notation);

    const nodes = makeLabeledNoteNodes(notation, {
      [targetKeyPos]: { mode: 'anchor', primary: keyName, secondary: '', subBadge: 'I' },
      [domSpelled.pos]: { mode: 'source', primary: formatSpelledNote(domSpelled, notation), secondary: '', subBadge: 'V7' }
    });

    return {
      id: card.id,
      category: 'bass',
      eyebrow: 'BASS TRITONE SUB',
      promptHtml: `Tritone sub <span class="q-badge">♭II7</span> resolving to <b>${keyName}</b>`,
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos: subSpelled.pos,
          centerLabel: '♭II7',
          centerSub: `sub for ${domName}`,
          stepChipLabel: '♭II7',
          revealedPrimary: subName,
          revealedSub: '♭II7',
          midiToPlay: bassMidiForPos(subSpelled.pos, 36)
        }
      ],
      geometry: { type: 'two-hop', fromPos: domSpelled.pos, midPos: subSpelled.pos, toPos: targetKeyPos },
      doneCenterPrimary: subName,
      doneCenterSub: `→ ${keyName}`,
      explanation: `${subName} sits directly opposite ${domName} on the Circle and slides chromatically down into ${keyName}.`
    };
  }

  // 5D. Minor Pentatonic Pocket (1 -> ♭3 -> 4 -> 5 -> ♭7)
  if (kind === 'bass_pentatonic') {
    const { rootPos } = params;
    const degrees = ['1', '♭3', '4', '5', '♭7'];
    const rootSpelled = chooseBestRootSpelling(rootPos, degrees);
    const rootName = formatSpelledNote(rootSpelled, notation);
    const rootMinLabel = formatChord(rootSpelled, 'm', notation);
    const baseMidi = bassMidiForPos(rootPos, 33);
    const nodes = makeLabeledNoteNodes(notation);

    const steps = degrees.map((sym) => {
      const iv = INTERVALS[sym];
      const sp = spellInterval(rootSpelled, sym);
      const nm = formatSpelledNote(sp, notation);
      return {
        targetPos: sp.pos,
        centerLabel: sym,
        centerSub: `${rootMinLabel} penta`,
        stepChipLabel: sym,
        revealedPrimary: nm,
        revealedSub: sym,
        midiToPlay: baseMidi + iv.semitones
      };
    });

    return {
      id: card.id,
      category: 'bass',
      eyebrow: 'MINOR PENTATONIC POCKET',
      promptHtml: `Play <b>${rootName}</b> minor pentatonic`,
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'polygon', positions: steps.map((s) => s.targetPos) },
      doneCenterPrimary: rootMinLabel,
      doneCenterSub: '5-note pocket',
      explanation: `Every minor pentatonic is 5 contiguous slices on the Circle (−3 CCW to +1 CW).`
    };
  }

  // 5E. Dom7 Guide Tones (3 -> ♭7 across diameter)
  if (kind === 'bass_guidetones') {
    const { rootPos } = params;
    const degrees = ['3', '♭7'];
    const rootSpelled = chooseBestRootSpelling(rootPos, degrees);
    const rootName = formatSpelledNote(rootSpelled, notation);
    const chordName = formatChord(rootSpelled, '7', notation);
    const baseMidi = bassMidiForPos(rootPos, 35);
    const nodes = makeLabeledNoteNodes(notation, {
      [rootPos]: { mode: 'anchor', primary: rootName, secondary: '', subBadge: '1' }
    });

    const steps = degrees.map((sym) => {
      const iv = INTERVALS[sym];
      const sp = spellInterval(rootSpelled, sym);
      const nm = formatSpelledNote(sp, notation);
      return {
        targetPos: sp.pos,
        centerLabel: sym,
        centerSub: `of ${chordName}`,
        stepChipLabel: sym,
        revealedPrimary: nm,
        revealedSub: sym,
        midiToPlay: baseMidi + iv.semitones
      };
    });

    return {
      id: card.id,
      category: 'bass',
      eyebrow: 'DOM7 GUIDE TONES',
      promptHtml: `Tap guide tones <span class="q-badge">3</span> → <span class="q-badge">♭7</span> of <b>${chordName}</b>`,
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'arc', fromPos: steps[0].targetPos, toPos: steps[1].targetPos },
      doneCenterPrimary: `${steps[0].revealedPrimary}↔${steps[1].revealedPrimary}`,
      doneCenterSub: 'Tritone pair',
      explanation: `3 (${steps[0].revealedPrimary}) and ♭7 (${steps[1].revealedPrimary}) of ${chordName} sit diametrically opposite on the Circle.`
    };
  }

  // 6A. 4-String Bass Neck Dot -> Note on the Circle
  if (kind === 'neck_to_note') {
    const { stringIndex, fret } = params;
    const info = getBassFretInfo(stringIndex, fret);
    const strLabel = notation === 'letter' ? info.stringLetter : info.stringSolfege;
    const noteName = getCanonicalNoteName(info.pos, notation);
    const nodes = makeLabeledNoteNodes(notation);

    return {
      id: card.id,
      category: 'fretboard',
      eyebrow: `BASS NECK · ${strLabel.toUpperCase()} STRING · FRET ${fret}`,
      promptHtml: `Tap this bass note on the Circle`,
      fretboard: {
        stringIndex,
        fret,
        badgeText: `${strLabel} · f${fret}`
      },
      nodes,
      steps: [
        {
          targetPos: info.pos,
          centerLabel: `${strLabel} · ${fret}`,
          centerSub: 'Tap note',
          stepChipLabel: noteName,
          revealedPrimary: noteName,
          revealedSub: `f${fret}`,
          midiToPlay: info.midi
        }
      ],
      geometry: { type: 'arc', fromPos: CIRCLE_POSITIONS[BASS_STRING_POS(stringIndex)].pos, toPos: info.pos },
      doneCenterPrimary: noteName,
      doneCenterSub: `${strLabel} string f${fret}`,
      explanation: `${strLabel} string, fret ${fret} is ${noteName}.`
    };
  }

  // 6B. 4-String Bass Neck Dot -> Harmonic Interval on the Circle
  if (kind === 'neck_to_interval') {
    const { stringIndex, fret, symbol } = params;
    const info = getBassFretInfo(stringIndex, fret);
    const iv = INTERVALS[symbol];
    const strLabel = notation === 'letter' ? info.stringLetter : info.stringSolfege;
    const rootSpelled = chooseBestRootSpelling(info.pos, [symbol]);
    const targetSpelled = spellInterval(rootSpelled, symbol);
    const rootName = formatSpelledNote(rootSpelled, notation);
    const targetName = formatSpelledNote(targetSpelled, notation);

    const nodes = makeLabeledNoteNodes(notation);

    return {
      id: card.id,
      category: 'fretboard',
      eyebrow: `NECK → HARMONY · ${strLabel.toUpperCase()} FRET ${fret}`,
      promptHtml: `Tap the <b>${iv.name}</b> <span class="q-badge">${symbol}</span> of this fret`,
      fretboard: {
        stringIndex,
        fret,
        badgeText: `${strLabel} · f${fret}`
      },
      nodes,
      steps: [
        {
          targetPos: targetSpelled.pos,
          centerLabel: symbol,
          centerSub: `of ${strLabel} f${fret}`,
          stepChipLabel: symbol,
          revealedPrimary: targetName,
          revealedSub: `${symbol} of ${rootName}`,
          midiToPlay: info.midi + iv.semitones
        }
      ],
      geometry: { type: 'arc', fromPos: info.pos, toPos: targetSpelled.pos },
      doneCenterPrimary: targetName,
      doneCenterSub: `${rootName} → ${targetName}`,
      explanation: `${strLabel} fret ${fret} is ${rootName}; its ${iv.name} (${symbol}) is ${targetName} (${formatCircleStepDelta(iv.circleOffset)}).`
    };
  }

  throw new Error(`Unhandled quiz kind: ${kind}`);
}

function BASS_STRING_POS(stringIndex) {
  // Open string positions on the Circle: E=4, A=3, D=2, G=1
  return [4, 3, 2, 1][stringIndex] ?? 0;
}
