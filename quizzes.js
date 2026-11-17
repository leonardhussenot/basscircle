// BassCircle v2 — Complete 8-Mode Circle of Fifths, Clé de Fa, Ear & Bass Harmony Curriculum

import {
  BASS_STRINGS,
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

import { bassStaffStepToNote } from './staff.js';

export const QUIZ_CATEGORIES = [
  { id: 'notes', label: 'Notes', desc: 'Blank circle notes & bilingual reflex' },
  { id: 'degrees', label: 'Degrees', desc: 'Blank circle 1–7 & chromatic degrees' },
  { id: 'clef', label: 'Clé de Fa', desc: 'Read bass clef 𝄢 onto the Circle' },
  { id: 'ear', label: 'Ear', desc: 'Hear bass intervals & walks on Circle' },
  { id: 'intervals', label: 'Intervals', desc: '3rd, ♭3, ♭7, chromatic & degree math' },
  { id: 'chords', label: 'Chords', desc: 'Constellations, slash chords & relatives' },
  { id: 'bass', label: 'Grooves', desc: 'Voice-leading, ii–V–I, stage bridge' },
  { id: 'fretboard', label: 'Neck', desc: 'Bidirectional 4-string neck ↔ Circle' }
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

function oppositeNotation(notation) {
  return notation === 'letter' ? 'solfege' : 'letter';
}

/**
 * Builds the canonical v2 curriculum (~330 high-density, trimmed-fat cards across 8 modes).
 */
export function buildCanonicalDeckDefinitions() {
  const defs = [];

  // =========================================================================
  // 1. NOTES (Blank Circle Notes + Bilingual Do Ré Mi <-> C D E Stage Reflex)
  // =========================================================================
  for (let pos = 1; pos <= 11; pos++) {
    defs.push({
      id: `notes_spot_${pos}`,
      category: 'notes',
      kind: 'note_spot',
      params: { targetPos: pos, preferFlat: false, crossNotation: false }
    });
  }
  defs.push({
    id: 'notes_spot_6_flat',
    category: 'notes',
    kind: 'note_spot',
    params: { targetPos: 6, preferFlat: true, crossNotation: false }
  });

  // Bilingual Stage Reflex on Blank Circle: prompt in Anglo when Circle is Solfège (and vice versa!)
  for (const [pos, flat] of [[1, false], [2, false], [3, false], [4, false], [5, false], [6, false], [8, true], [9, true], [10, true], [11, false]]) {
    defs.push({
      id: `notes_bilingual_${pos}`,
      category: 'notes',
      kind: 'note_spot',
      params: { targetPos: pos, preferFlat: flat, crossNotation: true }
    });
  }

  // Rotated single-note anchors (place 4 notes relative to any non-12h anchor)
  for (const anchorPos of [1, 3, 4, 6, 8, 9, 10, 11]) {
    defs.push({
      id: `notes_quad_${anchorPos}`,
      category: 'notes',
      kind: 'note_quad',
      params: { anchorPos }
    });
  }

  // Full & half sweeps
  defs.push(
    { id: 'notes_sweep_sharps', category: 'notes', kind: 'note_sweep', params: { mode: 'sharps' } },
    { id: 'notes_sweep_flats', category: 'notes', kind: 'note_sweep', params: { mode: 'flats' } },
    { id: 'notes_sweep_fifths', category: 'notes', kind: 'note_sweep', params: { mode: 'fifths' } },
    { id: 'notes_sweep_fourths', category: 'notes', kind: 'note_sweep', params: { mode: 'fourths' } },
    { id: 'notes_sweep_all12', category: 'notes', kind: 'note_sweep', params: { mode: 'all12' } }
  );

  // =========================================================================
  // 2. DEGREES (Blank Circle Numeric Degrees around randomly rotated `1`)
  // =========================================================================
  const degreeTargets = ['5', '4', '2', '6', '3', '7', '♭7', '♭3', '♭6', '♭2', '♭5', '♯4'];
  for (const sym of degreeTargets) {
    defs.push({
      id: `deg_spot_${sym}`,
      category: 'degrees',
      kind: 'deg_spot',
      params: { symbol: sym, showName: true }
    });
  }
  for (const sym of ['3', '♭3', '4', '5', '6', '♭7', '7', '♭5', '♭2', '♭6']) {
    defs.push({
      id: `deg_pure_${sym}`,
      category: 'degrees',
      kind: 'deg_spot',
      params: { symbol: sym, showName: false }
    });
  }

  defs.push(
    { id: 'deg_fill_maj_order', category: 'degrees', kind: 'deg_multi', params: { preset: 'maj_order' } },
    { id: 'deg_fill_maj_shuf', category: 'degrees', kind: 'deg_multi', params: { preset: 'maj_shuf' } },
    { id: 'deg_fill_min_shuf', category: 'degrees', kind: 'deg_multi', params: { preset: 'min_shuf' } },
    { id: 'deg_fill_dorian', category: 'degrees', kind: 'deg_multi', params: { preset: 'dorian' } },
    { id: 'deg_fill_dom7', category: 'degrees', kind: 'deg_multi', params: { preset: 'dom7' } },
    { id: 'deg_fill_m7', category: 'degrees', kind: 'deg_multi', params: { preset: 'm7' } },
    { id: 'deg_fill_maj7', category: 'degrees', kind: 'deg_multi', params: { preset: 'maj7' } },
    { id: 'deg_fill_penta_min', category: 'degrees', kind: 'deg_multi', params: { preset: 'penta_min' } },
    { id: 'deg_fill_blues', category: 'degrees', kind: 'deg_multi', params: { preset: 'blues' } },
    { id: 'deg_fill_chromatic12', category: 'degrees', kind: 'deg_multi', params: { preset: 'chromatic12' } }
  );

  // =========================================================================
  // 3. CLÉ DE FA (𝄢 Bass Clef Sight-Reading -> Circle of Fifths)
  // =========================================================================
  // 3A. Core Landmarks (Open bass strings + Fa clef line + Do4 Clé d'Ut bridge!)
  const clefLandmarks = [
    { step: 6, hint: '4th line · between the 𝄢 dots (Clé de Fa anchor!)', highlightFa: true },
    { step: 10, hint: '1st ledger above · Middle C (your Clé d’Ut reference!)', highlightFa: false },
    { step: -2, hint: '1st ledger below · Open low Mi / E string', highlightFa: false },
    { step: 1, hint: '1st space · Open La / A string', highlightFa: false },
    { step: 4, hint: 'Middle line (3rd) · Open Ré / D string', highlightFa: false },
    { step: 7, hint: 'Top space (4th) · Open Sol / G string', highlightFa: false }
  ];
  for (const lm of clefLandmarks) {
    defs.push({
      id: `clef_landmark_s${lm.step}`,
      category: 'clef',
      kind: 'clef_single',
      params: { step: lm.step, acc: 0, landmarkHint: lm.hint, highlightFa: lm.highlightFa }
    });
  }

  // 3B. Full 4-string Bass Range Naturals (steps -2 through +12)
  for (let step = -2; step <= 12; step++) {
    defs.push({
      id: `clef_nat_s${step}`,
      category: 'clef',
      kind: 'clef_single',
      params: { step, acc: 0, landmarkHint: '', highlightFa: false }
    });
  }

  // 3C. Engraved Inline Accidentals (♯ & ♭) on Clé de Fa
  const clefAccidentals = [
    [-1, 1], [0, 1], [2, -1], [3, 1], [4, -1], [5, -1],
    [6, 1], [7, 1], [8, -1], [9, -1], [10, 1], [11, -1]
  ];
  for (const [step, acc] of clefAccidentals) {
    defs.push({
      id: `clef_acc_s${step}_${acc > 0 ? 'sharp' : 'flat'}`,
      category: 'clef',
      kind: 'clef_single',
      params: { step, acc, landmarkHint: '', highlightFa: false }
    });
  }

  // 3D. Real Sheet-Music Key Signature Sight-Reading (note affected by clef key signature!)
  const clefInKeyDrills = [
    { step: 6, acc: 1, keySig: { count: 1, sign: '♯' }, keyLabelPos: 1 },  // Sol maj: Fa -> Fa♯
    { step: -1, acc: 1, keySig: { count: 1, sign: '♯' }, keyLabelPos: 1 }, // Low Fa -> Fa♯
    { step: 3, acc: 1, keySig: { count: 2, sign: '♯' }, keyLabelPos: 2 },  // Ré maj: Do -> Do♯
    { step: 10, acc: 1, keySig: { count: 2, sign: '♯' }, keyLabelPos: 2 }, // High Do -> Do♯
    { step: 7, acc: 1, keySig: { count: 3, sign: '♯' }, keyLabelPos: 3 },  // La maj: Sol -> Sol♯
    { step: 2, acc: -1, keySig: { count: 1, sign: '♭' }, keyLabelPos: 11 }, // Fa maj: Si -> Si♭
    { step: 9, acc: -1, keySig: { count: 1, sign: '♭' }, keyLabelPos: 11 }, // High Si -> Si♭
    { step: 5, acc: -1, keySig: { count: 2, sign: '♭' }, keyLabelPos: 10 }, // Si♭ maj: Mi -> Mi♭
    { step: 1, acc: -1, keySig: { count: 3, sign: '♭' }, keyLabelPos: 9 },  // Mi♭ maj: La -> La♭
    { step: 8, acc: -1, keySig: { count: 3, sign: '♭' }, keyLabelPos: 9 },  // High La -> La♭
    { step: 4, acc: -1, keySig: { count: 4, sign: '♭' }, keyLabelPos: 8 }   // La♭ maj: Ré -> Ré♭
  ];
  clefInKeyDrills.forEach((d, idx) => {
    defs.push({
      id: `clef_inkey_${idx}`,
      category: 'clef',
      kind: 'clef_keysig_note',
      params: d
    });
  });

  // 3E. 3-Note Engraved Bass Riff Sight-Read (read left-to-right on Clé de Fa!)
  const clefRiffs = [
    { id: 'riff_cmaj', notes: [[3, 0], [5, 0], [7, 0]], label: 'Major triad figure' },        // Do - Mi - Sol
    { id: 'riff_fmin', notes: [[-1, 0], [1, -1], [3, 0]], label: 'Low minor triad' },        // Fa - La♭ - Do
    { id: 'riff_gdom', notes: [[0, 0], [2, 0], [6, 0]], label: 'Low Sol7 shell (1–3–♭7)' },  // Sol - Si - Fa
    { id: 'riff_walk_d', notes: [[4, 0], [6, 1], [7, 0]], label: 'Walking approach' },       // Ré - Fa♯ - Sol
    { id: 'riff_bb_walk', notes: [[2, -1], [4, 0], [6, 0]], label: 'Si♭ major triad' },      // Si♭ - Ré - Fa
    { id: 'riff_high_c', notes: [[7, 0], [9, -1], [10, 0]], label: 'Upper register groove' } // Sol - Si♭ - Do
  ];
  for (const r of clefRiffs) {
    defs.push({
      id: `clef_${r.id}`,
      category: 'clef',
      kind: 'clef_riff',
      params: r
    });
  }

  // =========================================================================
  // 4. EAR -> CIRCLE (Hear Bass Interval or Root Movement, Tap on Circle!)
  // =========================================================================
  for (const sym of ['5', '4', '3', '♭3', '♭7', '7', '6', '♭6', '♭5', '2', '♭2']) {
    defs.push({
      id: `ear_iv_${sym}`,
      category: 'ear',
      kind: 'ear_interval',
      params: { symbol: sym }
    });
  }
  const earWalks = [
    { id: 'I_IV_V', seq: ['4', '5'], title: 'Classic 3-chord groove (1 → ? → ?)', explain: '1 → 4 (−1 CCW) → 5 (+1 CW).' },
    { id: 'I_V_IV', seq: ['5', '4'], title: 'Rock turnaround (1 → ? → ?)', explain: '1 → 5 (+1 CW) → 4 (−1 CCW).' },
    { id: 'I_bVII_IV', seq: ['♭7', '4'], title: 'Mixolydian rock/funk cadence (1 → ? → ?)', explain: '1 → ♭7 (−2 CCW) → 4 (−1 CCW).' },
    { id: 'i_bVI_bVII', seq: ['♭6', '♭7'], title: 'Minor anthem walk (1 → ? → ?)', explain: '1 → ♭6 (−4 CCW) → ♭7 (−2 CCW).' },
    { id: 'I_vi_IV_V', seq: ['6', '4', '5'], title: 'Soul progression (1 → ? → ? → ?)', explain: '1 → 6 (+3 CW) → 4 (−1 CCW) → 5 (+1 CW).' },
    { id: 'I_ii_V', seq: ['2', '5'], title: 'Jazz setup (1 → ? → ?)', explain: '1 → 2 (+2 CW) → 5 (+1 CW).' },
    { id: 'arp_dom7', seq: ['3', '5', '♭7'], title: 'Heard 7th arpeggio (1 → ? → ? → ?)', explain: 'Dom7: 1 → 3 (+4 CW) → 5 (+1 CW) → ♭7 (−2 CCW).' },
    { id: 'arp_m7', seq: ['♭3', '5', '♭7'], title: 'Heard 7th arpeggio (1 → ? → ? → ?)', explain: 'Minor 7th: 1 → ♭3 (−3 CCW) → 5 (+1 CW) → ♭7 (−2 CCW).' }
  ];
  for (const w of earWalks) {
    defs.push({
      id: `ear_walk_${w.id}`,
      category: 'ear',
      kind: 'ear_walk',
      params: w
    });
  }

  // =========================================================================
  // 5. INTERVALS, CHROMATIC BASS APPROACHES & DEGREE HARMONY (Trimmed Fat!)
  // =========================================================================
  // High-value non-trivial intervals across all 12 keys (3, ♭3, ♭7, 7, ♭5, plus curated 6/♭6/4/5)
  for (let pos = 0; pos < 12; pos++) {
    for (const sym of ['3', '♭3', '♭7', '♭5']) {
      defs.push({
        id: `iv_note_${pos}_${sym}`,
        category: 'intervals',
        kind: 'interval_of_note',
        params: { rootPos: pos, symbol: sym }
      });
    }
  }
  for (const pos of [0, 1, 2, 3, 4, 8, 9, 10, 11]) {
    defs.push(
      { id: `iv_note_${pos}_6`, category: 'intervals', kind: 'interval_of_note', params: { rootPos: pos, symbol: '6' } },
      { id: `iv_note_${pos}_b6`, category: 'intervals', kind: 'interval_of_note', params: { rootPos: pos, symbol: '♭6' } }
    );
  }
  // Blind-first 4th & 5th drills on tricky sharp/flat keys (6h/7h/8h/5h)
  for (const pos of [4, 5, 6, 7, 8, 9]) {
    defs.push(
      { id: `iv_blind_${pos}_5`, category: 'intervals', kind: 'interval_of_note', params: { rootPos: pos, symbol: '5', forceBlind: true } },
      { id: `iv_blind_${pos}_4`, category: 'intervals', kind: 'interval_of_note', params: { rootPos: pos, symbol: '4', forceBlind: true } }
    );
  }

  // Chromatic Bass Approach Math: ±1 fret on the neck = ±5 steps on the Circle!
  for (const pos of [0, 1, 2, 3, 4, 8, 9, 10, 11]) {
    defs.push(
      {
        id: `iv_chrom_below_${pos}`,
        category: 'intervals',
        kind: 'chromatic_approach',
        params: { targetPos: pos, direction: 'below' } // 1 fret below = 7 (+5 CW)
      },
      {
        id: `iv_chrom_above_${pos}`,
        category: 'intervals',
        kind: 'chromatic_approach',
        params: { targetPos: pos, direction: 'above' } // 1 fret above = ♭2 (−5 CCW)
      }
    );
  }

  // Compound Degree Math ("Major 3rd of degree 4", etc.) — Numeric & In-Key
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
    { src: '♭3', iv: '3', result: '5', chordHint: '♭III chord' }
  ];
  for (const pair of compoundDegPairs) {
    defs.push({
      id: `iv_deg_${pair.src}_${pair.iv}`,
      category: 'intervals',
      kind: 'interval_of_degree_numeric',
      params: pair
    });
  }

  const inKeyDegreeDrills = [
    { keyPos: 0, roman: 'IV', srcSym: '4', iv: '3' },
    { keyPos: 1, roman: 'V', srcSym: '5', iv: '3' },
    { keyPos: 11, roman: 'ii', srcSym: '2', iv: '♭3' },
    { keyPos: 10, roman: 'V7', srcSym: '5', iv: '♭7' },
    { keyPos: 9, roman: 'IV', srcSym: '4', iv: '3' },
    { keyPos: 2, roman: 'vi', srcSym: '6', iv: '♭3' },
    { keyPos: 3, roman: 'V', srcSym: '5', iv: '3' },
    { keyPos: 8, roman: 'ii', srcSym: '2', iv: '♭3' }
  ];
  for (const item of inKeyDegreeDrills) {
    defs.push({
      id: `iv_inkey_${item.keyPos}_${item.roman}_${item.iv}`,
      category: 'intervals',
      kind: 'interval_of_degree_inkey',
      params: item
    });
  }

  // =========================================================================
  // 6. CHORDS (Reverse Constellations, Slash Chords / Inversions, & Relatives)
  // =========================================================================
  // 6A. Reverse Constellation: 4 chord nodes light up -> Tap the Root (1)!
  const constellationQualities = [
    { quality: 'Dom7', suffix: '7', degrees: ['1', '3', '5', '♭7'], positions: [0, 1, 3, 8, 9, 10, 11] },
    { quality: 'm7', suffix: 'm7', degrees: ['1', '♭3', '5', '♭7'], positions: [0, 1, 2, 4, 9, 10, 11] },
    { quality: 'Maj7', suffix: 'Maj7', degrees: ['1', '3', '5', '7'], positions: [0, 1, 9, 10, 11] },
    { quality: 'm7♭5', suffix: 'm7♭5', degrees: ['1', '♭3', '♭5', '♭7'], positions: [4, 5, 6] }
  ];
  for (const cq of constellationQualities) {
    for (const pos of cq.positions) {
      defs.push({
        id: `chord_const_${cq.quality}_${pos}`,
        category: 'chords',
        kind: 'constellation_root',
        params: { rootPos: pos, quality: cq.quality, suffix: cq.suffix, degrees: cq.degrees }
      });
    }
  }

  // 6B. Slash Chords & Bass Inversions (Read Slash -> Degree, and Inversion -> Bass Note!)
  const slashDegreeDrills = [
    { rootPos: 0, bassDeg: '3', chordQual: '' },     // Do/Mi -> 3
    { rootPos: 8, bassDeg: '3', chordQual: '' },     // La♭/Do -> 3
    { rootPos: 10, bassDeg: '3', chordQual: '' },    // Si♭/Ré -> 3
    { rootPos: 11, bassDeg: '♭3', chordQual: 'm' },  // Fa m/La♭ -> ♭3
    { rootPos: 0, bassDeg: '♭3', chordQual: 'm' },   // Do m/Mi♭ -> ♭3
    { rootPos: 1, bassDeg: '♭7', chordQual: '7' },   // Sol 7/Fa -> ♭7
    { rootPos: 2, bassDeg: '♭7', chordQual: 'm7' },  // Ré m7/Do -> ♭7
    { rootPos: 9, bassDeg: '5', chordQual: '' },     // Mi♭/Si♭ -> 5
    { rootPos: 11, bassDeg: '2', chordQual: '' }     // Fa/Sol (sus/9th bass!) -> 2
  ];
  slashDegreeDrills.forEach((sd, idx) => {
    defs.push({
      id: `chord_slash_deg_${idx}`,
      category: 'chords',
      kind: 'slash_to_degree',
      params: sd
    });
  });

  const inversionNoteDrills = [
    { rootPos: 9, invLabel: '1st inversion (bass on 3)', deg: '3', qual: '' },
    { rootPos: 11, invLabel: '1st inversion (bass on 3)', deg: '3', qual: '' },
    { rootPos: 3, invLabel: '1st inversion (bass on 3)', deg: '3', qual: '' },
    { rootPos: 10, invLabel: '3rd inversion (bass on ♭7)', deg: '♭7', qual: '7' },
    { rootPos: 0, invLabel: '3rd inversion (bass on ♭7)', deg: '♭7', qual: '7' },
    { rootPos: 2, invLabel: '1st inversion (bass on ♭3)', deg: '♭3', qual: 'm7' }
  ];
  inversionNoteDrills.forEach((inv, idx) => {
    defs.push({
      id: `chord_inv_note_${idx}`,
      category: 'chords',
      kind: 'inversion_to_note',
      params: inv
    });
  });

  // 6C. Relative Minor (+3 CW) & Relative Major (−3 CCW) + Key Signatures
  for (let pos = 0; pos < 12; pos++) {
    defs.push(
      { id: `rel_min_of_${pos}`, category: 'chords', kind: 'rel_minor', params: { majorPos: pos } },
      { id: `rel_maj_of_${pos}`, category: 'chords', kind: 'rel_major', params: { minorPos: pos } }
    );
  }
  for (const [count, sign, mode, targetPos] of [
    [2, '♯', 'major', 2], [3, '♯', 'major', 3], [4, '♯', 'major', 4], [5, '♯', 'major', 5],
    [2, '♭', 'major', 10], [3, '♭', 'major', 9], [4, '♭', 'major', 8], [5, '♭', 'major', 7],
    [2, '♯', 'minor', 5], [3, '♯', 'minor', 6], [2, '♭', 'minor', 1], [3, '♭', 'minor', 0], [4, '♭', 'minor', 11]
  ]) {
    defs.push({
      id: `keysig_${mode}_${sign}${count}`,
      category: 'chords',
      kind: 'key_sig',
      params: { count, sign, mode, targetPos }
    });
  }

  // =========================================================================
  // 7. GROOVES (3->7 Voice-Leading, ii-V-I, Stage Bridge, Tritone Sub, Pockets)
  // =========================================================================
  // 7A. Walking Bass 3rd <-> 7th Voice-Leading Resolutions (♭7 of Chord A -> 3 of Chord B!)
  for (const keyPos of [0, 1, 2, 8, 9, 10, 11]) {
    defs.push(
      {
        id: `bass_vl_ii_V_${keyPos}`,
        category: 'bass',
        kind: 'voice_leading',
        params: { keyPos, pair: 'ii-V' } // ♭7 of ii7 -> 3 of V7
      },
      {
        id: `bass_vl_V_I_${keyPos}`,
        category: 'bass',
        kind: 'voice_leading',
        params: { keyPos, pair: 'V-I' } // ♭7 of V7 -> 3 of IMaj7
      }
    );
  }

  // 7B. Bilingual Stage Bridge Arpeggios (Real-Book Anglo symbol -> Solfège Circle, and vice versa!)
  const stageBridgeChords = [
    { rootPos: 10, quality: 'm7', suffix: 'm7', degrees: ['1', '♭3', '5', '♭7'] },     // Bbm7 <-> Si♭ m7
    { rootPos: 9, quality: 'Maj7', suffix: 'Maj7', degrees: ['1', '3', '5', '7'] },    // EbMaj7 <-> Mi♭ Maj7
    { rootPos: 6, quality: 'Dom7', suffix: '7', degrees: ['1', '3', '5', '♭7'] },      // F#7 <-> Fa♯ 7
    { rootPos: 8, quality: 'Dom7', suffix: '7', degrees: ['1', '3', '5', '♭7'] },      // Ab7 <-> La♭ 7
    { rootPos: 4, quality: 'm7♭5', suffix: 'm7♭5', degrees: ['1', '♭3', '♭5', '♭7'] }, // Em7b5 <-> Mi m7♭5
    { rootPos: 2, quality: 'm7', suffix: 'm7', degrees: ['1', '♭3', '5', '♭7'] },      // Dm7 <-> Ré m7
    { rootPos: 3, quality: 'Dom7', suffix: '7', degrees: ['1', '3', '5', '♭7'] },      // A7 <-> La 7
    { rootPos: 11, quality: 'm7', suffix: 'm7', degrees: ['1', '♭3', '5', '♭7'] }      // Fm7 <-> Fa m7
  ];
  stageBridgeChords.forEach((cfg, idx) => {
    defs.push({
      id: `bass_bridge_${idx}`,
      category: 'bass',
      kind: 'bass_arpeggio',
      params: { ...cfg, crossNotation: true }
    });
  });

  // 7C. Core Arpeggios, Turnarounds, Guide Tones, Tritone Subs, Dorian & Pentatonic
  const arpConfigs = [
    { quality: 'Dom7', suffix: '7', degrees: ['1', '3', '5', '♭7'], keys: [0, 1, 9, 10, 11] },
    { quality: 'm7', suffix: 'm7', degrees: ['1', '♭3', '5', '♭7'], keys: [0, 1, 2, 6, 10] },
    { quality: 'Maj7', suffix: 'Maj7', degrees: ['1', '3', '5', '7'], keys: [0, 8, 9, 11] },
    { quality: 'Dorian', suffix: ' Dorian', degrees: ['1', '♭3', '6', '♭7'], keys: [0, 2, 4, 1] }
  ];
  for (const cfg of arpConfigs) {
    for (const pos of cfg.keys) {
      defs.push({
        id: `bass_arp_${cfg.quality}_${pos}`,
        category: 'bass',
        kind: 'bass_arpeggio',
        params: { rootPos: pos, quality: cfg.quality, suffix: cfg.suffix, degrees: cfg.degrees, crossNotation: false }
      });
    }
  }

  for (const pos of [0, 1, 2, 8, 9, 10, 11]) {
    defs.push({ id: `bass_iiVI_${pos}`, category: 'bass', kind: 'bass_progression', params: { keyPos: pos, prog: 'ii-V-I' } });
  }
  for (const pos of [0, 1, 9, 10, 11]) {
    defs.push({ id: `bass_viiiVI_${pos}`, category: 'bass', kind: 'bass_progression', params: { keyPos: pos, prog: 'vi-ii-V-I' } });
  }
  for (const pos of [0, 1, 4, 10, 11]) {
    defs.push({ id: `bass_I_IV_V_${pos}`, category: 'bass', kind: 'bass_progression', params: { keyPos: pos, prog: 'I-IV-V' } });
  }
  for (const pos of [0, 1, 9, 10, 11, 2]) {
    defs.push(
      { id: `bass_tritonesub_${pos}`, category: 'bass', kind: 'bass_tritone_sub', params: { targetKeyPos: pos } },
      { id: `bass_guidetones_${pos}`, category: 'bass', kind: 'bass_guidetones', params: { rootPos: pos } },
      { id: `bass_penta_${pos}`, category: 'bass', kind: 'bass_pentatonic', params: { rootPos: pos } }
    );
  }

  // =========================================================================
  // 8. NECK (Bidirectional: Neck -> Circle AND Circle -> All 4 Bass Strings!)
  // =========================================================================
  // 8A. Forward: Fretboard Dot -> Note on Circle
  const neckPositions = [
    [0, 1], [0, 4], [0, 6], [0, 8], [0, 11],
    [1, 1], [1, 3], [1, 6], [1, 8], [1, 11],
    [2, 1], [2, 4], [2, 6], [2, 8],
    [3, 1], [3, 3], [3, 6], [3, 8]
  ];
  for (const [sIdx, fret] of neckPositions) {
    defs.push({
      id: `neck_note_s${sIdx}_f${fret}`,
      category: 'fretboard',
      kind: 'neck_to_note',
      params: { stringIndex: sIdx, fret }
    });
  }

  // 8B. Forward: Fretboard Dot -> Harmonic Interval on Circle
  const neckIntervalDrills = [
    { stringIndex: 0, fret: 5, symbol: '3' },
    { stringIndex: 0, fret: 6, symbol: '♭7' },
    { stringIndex: 0, fret: 8, symbol: '♭3' },
    { stringIndex: 1, fret: 3, symbol: '3' },
    { stringIndex: 1, fret: 6, symbol: '5' },
    { stringIndex: 1, fret: 8, symbol: '♭7' },
    { stringIndex: 2, fret: 3, symbol: '3' },
    { stringIndex: 3, fret: 4, symbol: '♭3' }
  ];
  for (const item of neckIntervalDrills) {
    defs.push({
      id: `neck_iv_s${item.stringIndex}_f${item.fret}_${item.symbol}`,
      category: 'fretboard',
      kind: 'neck_to_interval',
      params: item
    });
  }

  // 8C. Reverse: Circle Note (or Harmonic Target!) -> Find across ALL 4 Bass Strings!
  for (let pos = 0; pos < 12; pos++) {
    defs.push({
      id: `neck_all4_pos_${pos}`,
      category: 'fretboard',
      kind: 'circle_to_all_strings',
      params: { targetPos: pos, harmonicFrom: null }
    });
  }
  for (const [rootPos, sym] of [[0, '♭3'], [1, '3'], [10, '3'], [11, '♭7'], [9, '5'], [2, '♭3']]) {
    defs.push({
      id: `neck_all4_iv_${rootPos}_${sym}`,
      category: 'fretboard',
      kind: 'circle_to_all_strings',
      params: { targetPos: mod(rootPos + INTERVALS[sym].circleOffset, 12), harmonicFrom: { rootPos, sym } }
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

/**
 * Builds the 12 Circle nodes for Note-based drills.
 * When `isBlind` is true, ONLY `Do` / `C` at 12h is labeled — the other 11 positions are blank
 * (forcing real mental-map recall instead of scanning text labels!).
 */
function makeNoteWheelNodes(notation, { isBlind = false, highlightMap = {} } = {}) {
  return Array.from({ length: 12 }, (_, pos) => {
    const std = getStandardNodeLabel(pos, notation);
    const hl = highlightMap[pos];

    if (isBlind) {
      if (pos === 0) {
        return {
          pos,
          mode: hl?.mode || 'anchor',
          primary: hl?.primary !== undefined ? hl.primary : std.primary,
          secondary: '',
          subBadge: hl?.subBadge || '12h',
          wrongFlashLabel: std.primary
        };
      }
      if (hl && hl.showEvenWhenBlind) {
        return {
          pos,
          mode: hl.mode || 'anchor',
          primary: hl.primary !== undefined ? hl.primary : std.primary,
          secondary: hl.secondary || '',
          subBadge: hl.subBadge || '',
          wrongFlashLabel: std.primary
        };
      }
      return {
        pos,
        mode: 'blank',
        primary: '',
        secondary: '',
        subBadge: '',
        wrongFlashLabel: std.primary
      };
    }

    return {
      pos,
      mode: hl?.mode || 'labeled',
      primary: hl?.primary !== undefined ? hl.primary : std.primary,
      secondary: hl?.secondary !== undefined ? hl.secondary : std.secondary,
      subBadge: hl?.subBadge || '',
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

function makeLabeledDegreeNodes(rootPos, sourcePos = null, isBlind = false) {
  if (isBlind) {
    return makeBlankDegreeNodes(rootPos);
  }
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

function shouldUseBlindWheel(card, blindSetting = 'auto', forceBlind = false) {
  if (forceBlind) return true;
  if (blindSetting === 'blind') return true;
  if (blindSetting === 'labels') return false;
  // Auto mode: once stability >= 2.8 days (after 1-2 clean reviews), graduate to Blind Wheel!
  return (card.stability || 0) >= 2.8;
}

/**
 * Instantiates a live interactive quiz specification from a card.
 */
export function instantiateQuiz(
  card,
  notation = 'solfege',
  seed = null,
  { blindMode = 'auto' } = {}
) {
  const def = DECK_MAP.get(card.id);
  if (!def) {
    throw new Error(`Unknown card definition: ${card.id}`);
  }
  const rand = seed !== null ? createRng(seed) : Math.random;
  const { kind, params } = def;
  const isBlind = shouldUseBlindWheel(card, blindMode, Boolean(params.forceBlind));

  // -------------------------------------------------------------------------
  // 1. NOTES (Blank Circle + Bilingual Reflex)
  // -------------------------------------------------------------------------
  if (kind === 'note_spot') {
    const { targetPos, preferFlat, crossNotation } = params;
    const promptNotation = crossNotation ? oppositeNotation(notation) : notation;
    const promptNote = getCanonicalNoteName(targetPos, promptNotation, preferFlat);
    const circleNote = getCanonicalNoteName(targetPos, notation, preferFlat);
    const doName = getCanonicalNoteName(0, notation);
    const nodes = makeBlankNoteNodes(notation, [0]);
    const stepDelta = formatCircleStepDelta(targetPos);

    return {
      id: card.id,
      category: 'notes',
      answerSurface: 'circle',
      eyebrow: crossNotation ? 'STAGE BRIDGE · BLANK CIRCLE' : 'BLANK CIRCLE · NOTES',
      promptHtml: crossNotation
        ? `Chart says <b>${promptNote}</b> · place on Circle`
        : `Place <b>${promptNote}</b> on the Circle`,
      staff: null,
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos,
          centerLabel: promptNote,
          centerSub: crossNotation ? 'Translate & tap' : 'Tap position',
          stepChipLabel: promptNote,
          revealedPrimary: circleNote,
          revealedSub: crossNotation ? promptNote : '',
          midiToPlay: bassMidiForPos(targetPos, 36)
        }
      ],
      geometry: { type: 'arc', fromPos: 0, toPos: targetPos },
      doneCenterPrimary: circleNote,
      doneCenterSub: crossNotation ? `= ${promptNote}` : stepDelta,
      explanation: crossNotation
        ? `${promptNote} = ${circleNote} (${stepDelta} from ${doName}).`
        : `${circleNote} is ${stepDelta} from ${doName}.`
    };
  }

  if (kind === 'note_quad') {
    const { anchorPos } = params;
    const anchorName = getCanonicalNoteName(anchorPos, notation);
    const nodes = makeBlankNoteNodes(notation, [anchorPos]);
    const pool = [];
    for (let p = 0; p < 12; p++) if (p !== anchorPos) pool.push(p);
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
      answerSurface: 'circle',
      eyebrow: 'BLANK CIRCLE · ROTATED ANCHOR',
      promptHtml: `Anchored on <b>${anchorName}</b> · place 4 notes`,
      staff: null,
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'polygon', positions: [anchorPos, ...picked] },
      doneCenterPrimary: '4 / 4',
      doneCenterSub: `from ${anchorName}`,
      explanation: `Clockwise = +5th, counter-clockwise = +4th from ${anchorName}.`
    };
  }

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
    } else {
      seq = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], rand);
      title = 'Fill <b>all 12 notes</b> around the Circle';
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
      answerSurface: 'circle',
      eyebrow: 'FILL THE CIRCLE · NOTES',
      promptHtml: title,
      staff: null,
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'walk', positions: [0, ...seq] },
      doneCenterPrimary: `${seq.length} / ${seq.length}`,
      doneCenterSub: 'Circle mapped',
      explanation: 'Right half = sharps (+5ths CW), left half = flats (+4ths CCW).'
    };
  }

  // -------------------------------------------------------------------------
  // 2. DEGREES (Blank Circle Numeric Degrees)
  // -------------------------------------------------------------------------
  if (kind === 'deg_spot') {
    const { symbol, showName } = params;
    const iv = INTERVALS[symbol];
    const rootPos = Math.floor(rand() * 12);
    const targetPos = mod(rootPos + iv.circleOffset, 12);
    const nodes = makeBlankDegreeNodes(rootPos);
    const stepDelta = formatCircleStepDelta(iv.circleOffset);

    return {
      id: card.id,
      category: 'degrees',
      answerSurface: 'circle',
      eyebrow: 'BLANK CIRCLE · DEGREES',
      promptHtml: showName
        ? `Place degree <b>${symbol}</b> <span class="q-sub">(${iv.name})</span>`
        : `Place degree <b>${symbol}</b> relative to <b>1</b>`,
      staff: null,
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
      takeaway = 'Major scale forms 7 contiguous slices: 4 (−1 CCW) through 7 (+5 CW).';
    } else if (preset === 'maj_shuf') {
      degList = shuffle(['2', '3', '4', '5', '6', '7'], rand);
      title = 'Place shuffled <b>Major</b> degrees';
      takeaway = '4 = −1 CCW, 5 = +1, 2 = +2, 6 = +3, 3 = +4, 7 = +5 CW.';
    } else if (preset === 'min_shuf') {
      degList = shuffle(['2', '♭3', '4', '5', '♭6', '♭7'], rand);
      title = 'Place shuffled <b>Natural Minor</b> degrees';
      takeaway = 'Natural minor is 7 contiguous slices from ♭6 (−4 CCW) to 2 (+2 CW).';
    } else if (preset === 'dorian') {
      degList = shuffle(['2', '♭3', '4', '5', '6', '♭7'], rand);
      title = 'Place <b>Dorian</b> funk degrees';
      takeaway = 'Dorian is mirror-symmetric around 1: −3 (♭3) through +3 (6)!';
    } else if (preset === 'dom7') {
      degList = ['3', '5', '♭7'];
      title = 'Place <b>Dom7</b> degrees <span class="q-sub">(3 · 5 · ♭7)</span>';
      takeaway = 'Dom7 combines +4 CW (3), +1 CW (5), and −2 CCW (♭7) — tritone between 3 & ♭7.';
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
      return {
        targetPos: mod(rootPos + iv.circleOffset, 12),
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
      answerSurface: 'circle',
      eyebrow: 'BLANK CIRCLE · DEGREES',
      promptHtml: title,
      staff: null,
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'polygon', positions: [rootPos, ...steps.map((s) => s.targetPos)] },
      doneCenterPrimary: '✓',
      doneCenterSub: `${degList.length} degrees`,
      explanation: takeaway
    };
  }

  // -------------------------------------------------------------------------
  // 3. CLÉ DE FA (𝄢 Bass Clef Sight-Reading -> Circle of Fifths)
  // -------------------------------------------------------------------------
  if (kind === 'clef_single') {
    const { step, acc, landmarkHint, highlightFa } = params;
    const noteInfo = bassStaffStepToNote(step, acc);
    const noteLabel = notation === 'letter' ? noteInfo.letterName : noteInfo.solfege;
    const nodes = makeNoteWheelNodes(notation, { isBlind });

    return {
      id: card.id,
      category: 'clef',
      answerSurface: 'circle',
      eyebrow: landmarkHint ? 'CLÉ DE FA · LANDMARK' : 'CLÉ DE FA · SIGHT-READ',
      promptHtml: landmarkHint
        ? `Read this <b>Clé de Fa</b> landmark`
        : `Read this <b>Clé de Fa</b> note on the Circle`,
      staff: {
        notes: [{ step, acc, showAccidental: acc !== 0, state: 'active' }],
        keySig: { count: 0, sign: '' },
        highlightFaLine: Boolean(highlightFa)
      },
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos: noteInfo.pos,
          centerLabel: '𝄢',
          centerSub: 'Tap note',
          stepChipLabel: noteLabel,
          revealedPrimary: noteLabel,
          revealedSub: '𝄢',
          midiToPlay: noteInfo.midi
        }
      ],
      geometry: { type: 'arc', fromPos: 11, toPos: noteInfo.pos }, // from Fa (11) reference
      doneCenterPrimary: noteLabel,
      doneCenterSub: 'Clé de Fa',
      explanation: landmarkHint
        ? `${noteLabel} — ${landmarkHint}.`
        : `Clé de Fa: 4th line = ${getCanonicalNoteName(11, notation)}, middle C = 1st ledger above → this note is ${noteLabel}.`
    };
  }

  if (kind === 'clef_keysig_note') {
    const { step, acc, keySig, keyLabelPos } = params;
    const noteInfo = bassStaffStepToNote(step, acc);
    const noteLabel = notation === 'letter' ? noteInfo.letterName : noteInfo.solfege;
    const keyName = getCanonicalNoteName(keyLabelPos, notation, keySig.sign === '♭');
    const nodes = makeNoteWheelNodes(notation, { isBlind });

    return {
      id: card.id,
      category: 'clef',
      answerSurface: 'circle',
      eyebrow: `CLÉ DE FA · KEY SIG (${keySig.count}${keySig.sign})`,
      promptHtml: `Watch the <b>key signature</b> · tap this note`,
      staff: {
        notes: [{ step, acc, showAccidental: false, state: 'active' }],
        keySig,
        highlightFaLine: false
      },
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos: noteInfo.pos,
          centerLabel: `${keySig.count}${keySig.sign}`,
          centerSub: 'Read key sig!',
          stepChipLabel: noteLabel,
          revealedPrimary: noteLabel,
          revealedSub: `${keySig.count}${keySig.sign}`,
          midiToPlay: noteInfo.midi
        }
      ],
      geometry: { type: 'arc', fromPos: keyLabelPos, toPos: noteInfo.pos },
      doneCenterPrimary: noteLabel,
      doneCenterSub: `in ${keyName} (${keySig.count}${keySig.sign})`,
      explanation: `With ${keySig.count}${keySig.sign} (${keyName} major) at the clef, this line/space reads as ${noteLabel}!`
    };
  }

  if (kind === 'clef_riff') {
    const { notes: rawNotes, label } = params;
    const parsed = rawNotes.map(([step, acc]) => bassStaffStepToNote(step, acc));
    const nodes = makeNoteWheelNodes(notation, { isBlind });

    const steps = parsed.map((inf, idx) => {
      const lbl = notation === 'letter' ? inf.letterName : inf.solfege;
      return {
        targetPos: inf.pos,
        centerLabel: `Note ${idx + 1}`,
        centerSub: `${idx + 1} / ${parsed.length}`,
        stepChipLabel: `${idx + 1}`,
        revealedPrimary: lbl,
        revealedSub: `#${idx + 1}`,
        midiToPlay: inf.midi
      };
    });

    const summary = steps.map((s) => s.revealedPrimary).join(' → ');

    return {
      id: card.id,
      category: 'clef',
      answerSurface: 'circle',
      eyebrow: 'CLÉ DE FA · 3-NOTE BASS FIGURE',
      promptHtml: `Sight-read left to right <span class="q-sub">(${label})</span>`,
      staff: {
        notes: rawNotes.map(([step, acc], idx) => ({
          step,
          acc,
          showAccidental: acc !== 0,
          state: idx === 0 ? 'active' : 'default'
        })),
        keySig: { count: 0, sign: '' },
        highlightFaLine: false
      },
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'walk', positions: steps.map((s) => s.targetPos) },
      doneCenterPrimary: '3 / 3',
      doneCenterSub: summary,
      explanation: `Clé de Fa figure: ${summary}.`
    };
  }

  // -------------------------------------------------------------------------
  // 4. EAR -> CIRCLE (Hear Bass Movement, Tap on Circle!)
  // -------------------------------------------------------------------------
  if (kind === 'ear_interval') {
    const { symbol } = params;
    const iv = INTERVALS[symbol];
    const rootPos = Math.floor(rand() * 12);
    const targetPos = mod(rootPos + iv.circleOffset, 12);
    const rootMidi = 34 + Math.floor(rand() * 8);
    const targetMidi = rootMidi + iv.semitones;
    const nodes = makeBlankDegreeNodes(rootPos);
    const stepDelta = formatCircleStepDelta(iv.circleOffset);

    return {
      id: card.id,
      category: 'ear',
      answerSurface: 'circle',
      eyebrow: 'EAR → CIRCLE · INTERVAL',
      promptHtml: `Listen to <b>1 → ?</b> · tap the degree you heard`,
      staff: null,
      fretboard: null,
      audioPromptMidis: [rootMidi, targetMidi],
      audioStepSec: 0.44,
      nodes,
      steps: [
        {
          targetPos,
          centerLabel: '▶ Hear',
          centerSub: 'Tap hub to replay',
          stepChipLabel: '?',
          revealedPrimary: symbol,
          revealedSub: iv.name,
          midiToPlay: targetMidi
        }
      ],
      geometry: { type: 'arc', fromPos: rootPos, toPos: targetPos },
      doneCenterPrimary: symbol,
      doneCenterSub: iv.name,
      explanation: `You heard ${iv.name} (${symbol}) — ${stepDelta} from 1.`
    };
  }

  if (kind === 'ear_walk') {
    const { seq, title, explain } = params;
    const rootPos = Math.floor(rand() * 12);
    const rootMidi = 35 + Math.floor(rand() * 6);
    const nodes = makeBlankDegreeNodes(rootPos);

    const promptMidis = [rootMidi, ...seq.map((sym) => rootMidi + INTERVALS[sym].semitones)];
    const steps = seq.map((sym, idx) => {
      const iv = INTERVALS[sym];
      return {
        targetPos: mod(rootPos + iv.circleOffset, 12),
        centerLabel: '▶ Hear',
        centerSub: `Note ${idx + 2} of ${seq.length + 1}`,
        stepChipLabel: `?${idx + 1}`,
        revealedPrimary: sym,
        revealedSub: '',
        midiToPlay: rootMidi + iv.semitones
      };
    });

    return {
      id: card.id,
      category: 'ear',
      answerSurface: 'circle',
      eyebrow: 'EAR → CIRCLE · BASS LINE',
      promptHtml: `Hear <b>${title}</b>`,
      staff: null,
      fretboard: null,
      audioPromptMidis: promptMidis,
      audioStepSec: 0.38,
      nodes,
      steps,
      geometry: { type: 'walk', positions: [rootPos, ...steps.map((s) => s.targetPos)] },
      doneCenterPrimary: `1→${seq.join('→')}`,
      doneCenterSub: 'Ear locked!',
      explanation: explain
    };
  }

  // -------------------------------------------------------------------------
  // 5. INTERVALS, CHROMATIC APPROACHES & DEGREE HARMONY
  // -------------------------------------------------------------------------
  if (kind === 'interval_of_note') {
    const { rootPos, symbol } = params;
    const iv = INTERVALS[symbol];
    const rootSpelled = chooseBestRootSpelling(rootPos, [symbol]);
    const rawTarget = spellInterval(rootSpelled, symbol);
    const targetSpelled = symbol === '♭5' ? toPracticalEnharmonic(rawTarget) : rawTarget;
    const rootName = formatSpelledNote(rootSpelled, notation);
    const targetName = formatSpelledNote(targetSpelled, notation);
    const targetPos = targetSpelled.pos;

    // In Blind mode, do NOT pre-highlight rootPos (unless it is 0/Do), forcing true mental map!
    const nodes = makeNoteWheelNodes(notation, {
      isBlind,
      highlightMap: isBlind
        ? {}
        : { [rootPos]: { mode: 'anchor', primary: rootName, secondary: '', subBadge: '1' } }
    });
    const stepDelta = formatCircleStepDelta(iv.circleOffset);

    return {
      id: card.id,
      category: 'intervals',
      answerSurface: 'circle',
      eyebrow: isBlind ? 'BLIND WHEEL · INTERVAL' : 'INTERVAL OF A NOTE',
      promptHtml: `${iv.name} <span class="q-badge">${symbol}</span> of <b>${rootName}</b>`,
      staff: null,
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
      revealExtraNodes: isBlind && rootPos !== targetPos
        ? [{ pos: rootPos, mode: 'anchor', primary: rootName, subBadge: '1' }]
        : [],
      rootMidiPreview: bassMidiForPos(rootPos, 36),
      geometry: { type: 'arc', fromPos: rootPos, toPos: targetPos },
      doneCenterPrimary: targetName,
      doneCenterSub: stepDelta,
      explanation: `${iv.name} (${symbol}) of ${rootName} is ${targetName} (${stepDelta}).`
    };
  }

  if (kind === 'chromatic_approach') {
    const { targetPos: destPos, direction } = params;
    const isBelow = direction === 'below';
    const ivSym = isBelow ? '7' : '♭2'; // 1 fret below = Maj 7th (+5 CW); 1 fret above = Min 2nd (−5 CCW)
    const destSpelled = chooseBestRootSpelling(destPos, [ivSym]);
    const approachSpelled = toPracticalEnharmonic(spellInterval(destSpelled, ivSym));
    const destName = formatSpelledNote(destSpelled, notation);
    const approachName = formatSpelledNote(approachSpelled, notation);
    const approachPos = approachSpelled.pos;

    const nodes = makeNoteWheelNodes(notation, {
      isBlind,
      highlightMap: isBlind
        ? {}
        : { [destPos]: { mode: 'anchor', primary: destName, secondary: '', subBadge: 'target' } }
    });

    const destMidi = bassMidiForPos(destPos, 38);
    const approachMidi = isBelow ? destMidi - 1 : destMidi + 1;

    return {
      id: card.id,
      category: 'intervals',
      answerSurface: 'circle',
      eyebrow: 'BASS CHROMATIC APPROACH',
      promptHtml: isBelow
        ? `<b>1 fret below</b> (leading tone) into <b>${destName}</b>`
        : `<b>1 fret above</b> (chromatic slide) into <b>${destName}</b>`,
      staff: null,
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos: approachPos,
          centerLabel: isBelow ? '−1 fret' : '+1 fret',
          centerSub: `→ ${destName}`,
          stepChipLabel: approachName,
          revealedPrimary: approachName,
          revealedSub: isBelow ? '+5 CW' : '−5 CCW',
          midiToPlay: approachMidi
        }
      ],
      revealExtraNodes: isBlind
        ? [{ pos: destPos, mode: 'anchor', primary: destName, subBadge: 'target' }]
        : [],
      rootMidiPreview: destMidi,
      geometry: { type: 'arc', fromPos: approachPos, toPos: destPos },
      doneCenterPrimary: `${approachName}→${destName}`,
      doneCenterSub: isBelow ? '+5 CW = −1 fret' : '−5 CCW = +1 fret',
      explanation: isBelow
        ? `1 fret below any note is always +5 steps CW on the Circle: ${approachName} → ${destName}.`
        : `1 fret above any note is always −5 steps CCW on the Circle: ${approachName} → ${destName}.`
    };
  }

  if (kind === 'interval_of_degree_numeric') {
    const { src, iv: ivSym, result, chordHint } = params;
    const srcIv = INTERVALS[src];
    const hopIv = INTERVALS[ivSym];
    const rootPos = Math.floor(rand() * 12);
    const srcPos = mod(rootPos + srcIv.circleOffset, 12);
    const targetPos = mod(srcPos + hopIv.circleOffset, 12);
    const nodes = makeLabeledDegreeNodes(rootPos, srcPos, isBlind);
    const hopDelta = formatCircleStepDelta(hopIv.circleOffset);

    return {
      id: card.id,
      category: 'intervals',
      answerSurface: 'circle',
      eyebrow: isBlind ? 'BLIND DEGREE HARMONY' : 'DEGREE HARMONY',
      promptHtml: `${hopIv.name} <span class="q-badge">${ivSym}</span> of degree <b>${src}</b>`,
      staff: null,
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
      revealExtraNodes: isBlind
        ? [{ pos: srcPos, mode: 'source', primary: src, subBadge: '' }]
        : [],
      geometry: { type: 'two-hop', fromPos: rootPos, midPos: srcPos, toPos: targetPos },
      doneCenterPrimary: result,
      doneCenterSub: hopDelta,
      explanation: `Degree ${src} (${chordHint}) + ${hopIv.name} (${hopDelta}) lands on degree ${result}.`
    };
  }

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

    const nodes = makeNoteWheelNodes(notation, {
      isBlind,
      highlightMap: isBlind
        ? {}
        : { [keyPos]: { mode: 'anchor', primary: keyName, secondary: '', subBadge: 'I' } }
    });

    return {
      id: card.id,
      category: 'intervals',
      answerSurface: 'circle',
      eyebrow: 'IN-KEY CHORD TONE',
      promptHtml: `In <b>${keyName}</b>: ${hopIv.name} <span class="q-badge">${ivSym}</span> of <b>${roman}</b>`,
      staff: null,
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
      revealExtraNodes: [
        { pos: keyPos, mode: 'anchor', primary: keyName, subBadge: 'I' },
        { pos: srcPos, mode: 'source', primary: chordRootName, subBadge: roman }
      ],
      geometry: { type: 'two-hop', fromPos: keyPos, midPos: srcPos, toPos: targetPos },
      doneCenterPrimary: targetName,
      doneCenterSub: `${roman} = ${chordRootName}`,
      explanation: `In ${keyName}, ${roman} is ${chordRootName}; its ${ivSym} is ${targetName}.`
    };
  }

  // -------------------------------------------------------------------------
  // 6. CHORDS (Reverse Constellations, Slash Chords, Relatives & Key Sigs)
  // -------------------------------------------------------------------------
  if (kind === 'constellation_root') {
    const { rootPos, quality, suffix, degrees } = params;
    const rootSpelled = chooseBestRootSpelling(rootPos, degrees);
    const chordName = formatChord(rootSpelled, suffix, notation);
    const rootName = formatSpelledNote(rootSpelled, notation);

    const chordMemberMap = {};
    const polyPositions = [];
    for (const sym of degrees) {
      const sp = spellInterval(rootSpelled, sym);
      polyPositions.push(sp.pos);
      chordMemberMap[sp.pos] = {
        mode: 'source',
        primary: isBlind && sp.pos !== 0 ? '●' : formatSpelledNote(sp, notation),
        secondary: '',
        subBadge: '',
        showEvenWhenBlind: true
      };
    }

    const nodes = makeNoteWheelNodes(notation, {
      isBlind,
      highlightMap: chordMemberMap
    });

    const revealExtras = degrees
      .filter((sym) => sym !== '1')
      .map((sym) => {
        const sp = spellInterval(rootSpelled, sym);
        return {
          pos: sp.pos,
          mode: 'placed',
          primary: formatSpelledNote(sp, notation),
          subBadge: sym
        };
      });

    return {
      id: card.id,
      category: 'chords',
      answerSurface: 'circle',
      eyebrow: `CHORD CONSTELLATION · ${quality.toUpperCase()}`,
      promptHtml: `4 tones of a <b>${quality}</b> are lit · tap its <b>Root (1)</b>`,
      staff: null,
      fretboard: null,
      initialGeometry: { type: 'polygon', positions: polyPositions },
      nodes,
      steps: [
        {
          targetPos: rootPos,
          centerLabel: `Root?`,
          centerSub: `${quality} shape`,
          stepChipLabel: '1',
          revealedPrimary: rootName,
          revealedSub: '1',
          midiToPlay: bassMidiForPos(rootPos, 35)
        }
      ],
      revealExtraNodes: revealExtras,
      geometry: { type: 'polygon', positions: polyPositions },
      doneCenterPrimary: chordName,
      doneCenterSub: degrees.join('·'),
      explanation: `That ${quality} shape (${degrees.join('·')}) is anchored on Root ${rootName} (${chordName}).`
    };
  }

  if (kind === 'slash_to_degree') {
    const { rootPos, bassDeg, chordQual } = params;
    const rootSpelled = chooseBestRootSpelling(rootPos, [bassDeg]);
    const bassSpelled = spellInterval(rootSpelled, bassDeg);
    const chordText = formatChord(rootSpelled, chordQual, notation);
    const bassText = formatSpelledNote(bassSpelled, notation);
    const slashSymbol = `${chordText}/${bassText}`;

    const wheelRootPos = Math.floor(rand() * 12);
    const iv = INTERVALS[bassDeg];
    const targetPos = mod(wheelRootPos + iv.circleOffset, 12);
    const nodes = makeLabeledDegreeNodes(wheelRootPos, null, isBlind);

    return {
      id: card.id,
      category: 'chords',
      answerSurface: 'circle',
      eyebrow: 'SLASH CHORD · BASS ROLE',
      promptHtml: `Playing <b>${slashSymbol}</b> · what degree is your bass note?`,
      staff: null,
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos,
          centerLabel: `/${bassText}`,
          centerSub: `in ${chordText}`,
          stepChipLabel: bassDeg,
          revealedPrimary: bassDeg,
          revealedSub: iv.name,
          midiToPlay: bassMidiForPos(bassSpelled.pos, 34)
        }
      ],
      geometry: { type: 'arc', fromPos: wheelRootPos, toPos: targetPos },
      doneCenterPrimary: bassDeg,
      doneCenterSub: slashSymbol,
      explanation: `In ${slashSymbol}, ${bassText} is the ${iv.name} (${bassDeg}) of ${formatSpelledNote(rootSpelled, notation)}.`
    };
  }

  if (kind === 'inversion_to_note') {
    const { rootPos, invLabel, deg, qual } = params;
    const rootSpelled = chooseBestRootSpelling(rootPos, [deg]);
    const bassSpelled = spellInterval(rootSpelled, deg);
    const chordText = formatChord(rootSpelled, qual, notation);
    const bassText = formatSpelledNote(bassSpelled, notation);
    const rootNote = formatSpelledNote(rootSpelled, notation);

    const nodes = makeNoteWheelNodes(notation, {
      isBlind,
      highlightMap: isBlind
        ? {}
        : { [rootPos]: { mode: 'anchor', primary: rootNote, secondary: '', subBadge: '1' } }
    });

    return {
      id: card.id,
      category: 'chords',
      answerSurface: 'circle',
      eyebrow: 'BASS INVERSION',
      promptHtml: `Put <b>${chordText}</b> in <b>${invLabel}</b>`,
      staff: null,
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos: bassSpelled.pos,
          centerLabel: deg,
          centerSub: `${chordText}/?`,
          stepChipLabel: deg,
          revealedPrimary: bassText,
          revealedSub: deg,
          midiToPlay: bassMidiForPos(bassSpelled.pos, 34)
        }
      ],
      revealExtraNodes: isBlind
        ? [{ pos: rootPos, mode: 'anchor', primary: rootNote, subBadge: '1' }]
        : [],
      geometry: { type: 'arc', fromPos: rootPos, toPos: bassSpelled.pos },
      doneCenterPrimary: `${chordText}/${bassText}`,
      doneCenterSub: `Bass = ${bassText}`,
      explanation: `${invLabel} of ${chordText} puts ${bassText} (${deg}) in the bass: ${chordText}/${bassText}.`
    };
  }

  if (kind === 'rel_minor') {
    const { majorPos } = params;
    const rootSpelled = chooseBestRootSpelling(majorPos, ['6']);
    const relMinSpelled = spellInterval(rootSpelled, '6');
    const majName = formatSpelledNote(rootSpelled, notation);
    const minName = formatChord(relMinSpelled, 'm', notation);
    const targetPos = mod(majorPos + 3, 12);

    const nodes = makeNoteWheelNodes(notation, {
      isBlind,
      highlightMap: isBlind
        ? {}
        : { [majorPos]: { mode: 'anchor', primary: majName, secondary: '', subBadge: 'I' } }
    });

    return {
      id: card.id,
      category: 'chords',
      answerSurface: 'circle',
      eyebrow: isBlind ? 'BLIND WHEEL · RELATIVE MINOR' : 'RELATIVE MINOR',
      promptHtml: `Relative minor <span class="q-badge">vi</span> of <b>${majName}</b>`,
      staff: null,
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
      revealExtraNodes: isBlind
        ? [{ pos: majorPos, mode: 'anchor', primary: majName, subBadge: 'I' }]
        : [],
      geometry: { type: 'arc', fromPos: majorPos, toPos: targetPos },
      doneCenterPrimary: minName,
      doneCenterSub: '+3 steps CW',
      explanation: `Relative minor (degree 6) is always +3 steps clockwise: ${majName} → ${minName}.`
    };
  }

  if (kind === 'rel_major') {
    const { minorPos } = params;
    const minSpelled = CIRCLE_POSITIONS[minorPos].minorAtThisPos;
    const majPos = mod(minorPos - 3, 12);
    const majSpelled = spellInterval(minSpelled, '♭3');
    const minLabel = formatChord(minSpelled, 'm', notation);
    const majLabel = formatSpelledNote(majSpelled, notation);

    const nodes = makeNoteWheelNodes(notation, {
      isBlind,
      highlightMap: isBlind
        ? {}
        : { [minorPos]: { mode: 'anchor', primary: minLabel, secondary: '', subBadge: 'vi' } }
    });

    return {
      id: card.id,
      category: 'chords',
      answerSurface: 'circle',
      eyebrow: isBlind ? 'BLIND WHEEL · RELATIVE MAJOR' : 'RELATIVE MAJOR',
      promptHtml: `Relative major <span class="q-badge">I</span> of <b>${minLabel}</b>`,
      staff: null,
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
      revealExtraNodes: isBlind
        ? [{ pos: minorPos, mode: 'anchor', primary: minLabel, subBadge: 'vi' }]
        : [],
      geometry: { type: 'arc', fromPos: minorPos, toPos: majPos },
      doneCenterPrimary: majLabel,
      doneCenterSub: '−3 steps CCW',
      explanation: `Relative major (♭3 of minor) is always −3 steps CCW: ${minLabel} → ${majLabel}.`
    };
  }

  if (kind === 'key_sig') {
    const { count, sign, mode, targetPos } = params;
    const sigText = `${count}${sign}`;
    const isMinor = mode === 'minor';
    const answerLabel = isMinor
      ? formatChord(CIRCLE_POSITIONS[targetPos].minorAtThisPos, 'm', notation)
      : getCanonicalNoteName(targetPos, notation, sign === '♭');

    const nodes = makeNoteWheelNodes(notation, { isBlind });

    return {
      id: card.id,
      category: 'chords',
      answerSurface: 'circle',
      eyebrow: 'KEY SIGNATURE · CLÉ DE FA',
      promptHtml: `Which <b>${isMinor ? 'minor' : 'major'}</b> key has this signature?`,
      staff: {
        notes: [],
        keySig: { count, sign },
        highlightFaLine: false
      },
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
        ? `${answerLabel} has ${sigText} (+3 CW from its relative major).`
        : `${count} steps ${sign === '♯' ? 'CW' : 'CCW'} from ${getCanonicalNoteName(0, notation)} = ${answerLabel} (${sigText}).`
    };
  }

  // -------------------------------------------------------------------------
  // 7. GROOVES (3->7 Voice-Leading, Stage Bridge, Arpeggios, Turnarounds)
  // -------------------------------------------------------------------------
  if (kind === 'voice_leading') {
    const { keyPos, pair } = params;
    const keySpelled = chooseBestRootSpelling(keyPos, ['2', '5', '4', '7', '3']);

    let chordAName = '';
    let chordBName = '';
    let fromSpelled = null;
    let toSpelled = null;

    if (pair === 'ii-V') {
      const iiSpelled = spellInterval(keySpelled, '2');
      const vSpelled = spellInterval(keySpelled, '5');
      chordAName = formatChord(iiSpelled, 'm7', notation);
      chordBName = formatChord(vSpelled, '7', notation);
      fromSpelled = spellInterval(keySpelled, '1'); // ♭7 of ii7 is 1!
      toSpelled = spellInterval(keySpelled, '7');   // 3 of V7 is 7!
    } else {
      const vSpelled = spellInterval(keySpelled, '5');
      chordAName = formatChord(vSpelled, '7', notation);
      chordBName = formatChord(keySpelled, 'Maj7', notation);
      fromSpelled = spellInterval(keySpelled, '4'); // ♭7 of V7 is 4!
      toSpelled = spellInterval(keySpelled, '3'); // 3 of IMaj7 is 3!
    }

    const fromNote = formatSpelledNote(fromSpelled, notation);
    const toNote = formatSpelledNote(toSpelled, notation);
    const fromMidi = bassMidiForPos(fromSpelled.pos, 39);
    const toMidi = fromMidi - 1; // Smooth 1-fret chromatic resolution downward!

    const nodes = makeNoteWheelNodes(notation, { isBlind });

    return {
      id: card.id,
      category: 'bass',
      answerSurface: 'circle',
      eyebrow: 'WALKING BASS · 7 → 3 VOICE-LEADING',
      promptHtml: `<b>${chordAName} → ${chordBName}</b>: tap <b>♭7</b> of ${chordAName} → <b>3</b> of ${chordBName}`,
      staff: null,
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos: fromSpelled.pos,
          centerLabel: '♭7',
          centerSub: `of ${chordAName}`,
          stepChipLabel: `♭7`,
          revealedPrimary: fromNote,
          revealedSub: '♭7',
          midiToPlay: fromMidi
        },
        {
          targetPos: toSpelled.pos,
          centerLabel: '3',
          centerSub: `of ${chordBName}`,
          stepChipLabel: `3`,
          revealedPrimary: toNote,
          revealedSub: '3',
          midiToPlay: toMidi
        }
      ],
      geometry: { type: 'arc', fromPos: fromSpelled.pos, toPos: toSpelled.pos },
      doneCenterPrimary: `${fromNote}→${toNote}`,
      doneCenterSub: '−1 fret (+5 CW)',
      explanation: `Smooth walking resolution: ♭7 of ${chordAName} (${fromNote}) drops 1 fret (+5 CW) into 3 of ${chordBName} (${toNote}).`
    };
  }

  if (kind === 'bass_arpeggio') {
    const { rootPos, quality, suffix, degrees, crossNotation } = params;
    const rootSpelled = chooseBestRootSpelling(rootPos, degrees);
    const promptNot = crossNotation ? oppositeNotation(notation) : notation;
    const promptChord = formatChord(rootSpelled, suffix, promptNot);
    const localChord = formatChord(rootSpelled, suffix, notation);
    const baseMidi = bassMidiForPos(rootPos, 33);
    const nodes = makeNoteWheelNodes(notation, { isBlind });

    const steps = degrees.map((degSym) => {
      const iv = INTERVALS[degSym];
      const sp = spellInterval(rootSpelled, degSym);
      const nm = formatSpelledNote(sp, notation);
      return {
        targetPos: sp.pos,
        centerLabel: degSym,
        centerSub: promptChord,
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
      answerSurface: 'circle',
      eyebrow: crossNotation
        ? 'STAGE BRIDGE · REAL BOOK CHORD'
        : `BASS ARPEGGIO · ${quality.toUpperCase()}`,
      promptHtml: crossNotation
        ? `Chart says <b>${promptChord}</b> · outline on Circle`
        : `Outline <b>${localChord}</b>`,
      staff: null,
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'polygon', positions: steps.map((s) => s.targetPos) },
      doneCenterPrimary: localChord,
      doneCenterSub: degrees.join('·'),
      explanation: `${localChord}${crossNotation ? ` (${promptChord})` : ''}: ${noteSummary}.`
    };
  }

  if (kind === 'bass_progression') {
    const { keyPos, prog } = params;
    const seqSpecs =
      prog === 'ii-V-I'
        ? [
            { deg: '2', roman: 'ii', qual: 'm7' },
            { deg: '5', roman: 'V', qual: '7' },
            { deg: '1', roman: 'I', qual: 'Maj7' }
          ]
        : prog === 'vi-ii-V-I'
        ? [
            { deg: '6', roman: 'vi', qual: 'm7' },
            { deg: '2', roman: 'ii', qual: 'm7' },
            { deg: '5', roman: 'V', qual: '7' },
            { deg: '1', roman: 'I', qual: 'Maj7' }
          ]
        : [
            { deg: '1', roman: 'I', qual: '' },
            { deg: '4', roman: 'IV', qual: '' },
            { deg: '5', roman: 'V', qual: '' }
          ];

    const rootSpelled = chooseBestRootSpelling(
      keyPos,
      seqSpecs.map((s) => s.deg)
    );
    const keyName = formatSpelledNote(rootSpelled, notation);
    const nodes = makeNoteWheelNodes(notation, {
      isBlind,
      highlightMap: isBlind
        ? {}
        : { [keyPos]: { mode: 'source', primary: keyName, secondary: '', subBadge: 'Key' } }
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
      answerSurface: 'circle',
      eyebrow: 'BASS TURNAROUND',
      promptHtml: `Walk <b>${prog.replace(/-/g, ' → ')}</b> in <b>${keyName}</b>`,
      staff: null,
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'walk', positions: steps.map((s) => s.targetPos) },
      doneCenterPrimary: prog,
      doneCenterSub: keyName,
      explanation:
        prog === 'I-IV-V'
          ? `I–IV–V hugs ${keyName} and its two immediate neighbors: ${walkStr}.`
          : `${prog} walks step-by-step CCW home to ${keyName}: ${walkStr}.`
    };
  }

  if (kind === 'bass_tritone_sub') {
    const { targetKeyPos } = params;
    const keySpelled = chooseBestRootSpelling(targetKeyPos, ['5', '♭2']);
    const domSpelled = spellInterval(keySpelled, '5');
    const subSpelled = toPracticalEnharmonic(spellInterval(keySpelled, '♭2'));
    const keyName = formatSpelledNote(keySpelled, notation);
    const domName = formatChord(domSpelled, '7', notation);
    const subName = formatChord(subSpelled, '7', notation);

    const nodes = makeNoteWheelNodes(notation, {
      isBlind,
      highlightMap: isBlind
        ? {}
        : {
            [targetKeyPos]: { mode: 'anchor', primary: keyName, secondary: '', subBadge: 'I' },
            [domSpelled.pos]: { mode: 'source', primary: formatSpelledNote(domSpelled, notation), secondary: '', subBadge: 'V7' }
          }
    });

    return {
      id: card.id,
      category: 'bass',
      answerSurface: 'circle',
      eyebrow: 'BASS TRITONE SUB',
      promptHtml: `Tritone sub <span class="q-badge">♭II7</span> resolving to <b>${keyName}</b>`,
      staff: null,
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos: subSpelled.pos,
          centerLabel: '♭II7',
          centerSub: `sub for ${domName}`,
          stepChipLabel: '♭II7',
          revealedPrimary: formatSpelledNote(subSpelled, notation),
          revealedSecondary: '7',
          revealedSub: '♭II7',
          midiToPlay: bassMidiForPos(subSpelled.pos, 36)
        }
      ],
      revealExtraNodes: [
        { pos: targetKeyPos, mode: 'anchor', primary: keyName, subBadge: 'I' },
        { pos: domSpelled.pos, mode: 'source', primary: formatSpelledNote(domSpelled, notation), subBadge: 'V7' }
      ],
      geometry: { type: 'two-hop', fromPos: domSpelled.pos, midPos: subSpelled.pos, toPos: targetKeyPos },
      doneCenterPrimary: subName,
      doneCenterSub: `→ ${keyName}`,
      explanation: `${subName} sits directly opposite ${domName} and slides 1 fret down into ${keyName}.`
    };
  }

  if (kind === 'bass_pentatonic') {
    const { rootPos } = params;
    const degrees = ['1', '♭3', '4', '5', '♭7'];
    const rootSpelled = chooseBestRootSpelling(rootPos, degrees);
    const rootName = formatSpelledNote(rootSpelled, notation);
    const rootMinLabel = formatChord(rootSpelled, 'm', notation);
    const baseMidi = bassMidiForPos(rootPos, 33);
    const nodes = makeNoteWheelNodes(notation, { isBlind });

    const steps = degrees.map((sym) => {
      const iv = INTERVALS[sym];
      const sp = spellInterval(rootSpelled, sym);
      return {
        targetPos: sp.pos,
        centerLabel: sym,
        centerSub: `${rootMinLabel} penta`,
        stepChipLabel: sym,
        revealedPrimary: formatSpelledNote(sp, notation),
        revealedSub: sym,
        midiToPlay: baseMidi + iv.semitones
      };
    });

    return {
      id: card.id,
      category: 'bass',
      answerSurface: 'circle',
      eyebrow: 'MINOR PENTATONIC POCKET',
      promptHtml: `Play <b>${rootName}</b> minor pentatonic`,
      staff: null,
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'polygon', positions: steps.map((s) => s.targetPos) },
      doneCenterPrimary: rootMinLabel,
      doneCenterSub: '5-note pocket',
      explanation: `Every minor pentatonic is 5 contiguous slices on the Circle (−3 CCW to +1 CW).`
    };
  }

  if (kind === 'bass_guidetones') {
    const { rootPos } = params;
    const degrees = ['3', '♭7'];
    const rootSpelled = chooseBestRootSpelling(rootPos, degrees);
    const rootName = formatSpelledNote(rootSpelled, notation);
    const chordName = formatChord(rootSpelled, '7', notation);
    const baseMidi = bassMidiForPos(rootPos, 35);
    const nodes = makeNoteWheelNodes(notation, {
      isBlind,
      highlightMap: isBlind
        ? {}
        : { [rootPos]: { mode: 'anchor', primary: rootName, secondary: '', subBadge: '1' } }
    });

    const steps = degrees.map((sym) => {
      const iv = INTERVALS[sym];
      const sp = spellInterval(rootSpelled, sym);
      return {
        targetPos: sp.pos,
        centerLabel: sym,
        centerSub: `of ${chordName}`,
        stepChipLabel: sym,
        revealedPrimary: formatSpelledNote(sp, notation),
        revealedSub: sym,
        midiToPlay: baseMidi + iv.semitones
      };
    });

    return {
      id: card.id,
      category: 'bass',
      answerSurface: 'circle',
      eyebrow: 'DOM7 GUIDE TONES',
      promptHtml: `Tap guide tones <span class="q-badge">3</span> → <span class="q-badge">♭7</span> of <b>${chordName}</b>`,
      staff: null,
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'arc', fromPos: steps[0].targetPos, toPos: steps[1].targetPos },
      doneCenterPrimary: `${steps[0].revealedPrimary}↔${steps[1].revealedPrimary}`,
      doneCenterSub: 'Tritone pair',
      explanation: `3 (${steps[0].revealedPrimary}) and ♭7 (${steps[1].revealedPrimary}) of ${chordName} sit diametrically opposite on the Circle.`
    };
  }

  // -------------------------------------------------------------------------
  // 8. NECK (Bidirectional Fretboard <-> Circle)
  // -------------------------------------------------------------------------
  if (kind === 'neck_to_note') {
    const { stringIndex, fret } = params;
    const info = getBassFretInfo(stringIndex, fret);
    const strLabel = notation === 'letter' ? info.stringLetter : info.stringSolfege;
    const noteName = getCanonicalNoteName(info.pos, notation);
    const nodes = makeNoteWheelNodes(notation, { isBlind });
    const openStringPos = [4, 3, 2, 1][stringIndex] ?? 0;

    return {
      id: card.id,
      category: 'fretboard',
      answerSurface: 'circle',
      eyebrow: `NECK → CIRCLE · ${strLabel.toUpperCase()} FRET ${fret}`,
      promptHtml: `Tap this bass fret on the Circle`,
      staff: null,
      fretboard: {
        mode: 'single',
        stringIndex,
        fret
      },
      nodes,
      steps: [
        {
          targetPos: info.pos,
          centerLabel: `${strLabel} · f${fret}`,
          centerSub: 'Tap note',
          stepChipLabel: noteName,
          revealedPrimary: noteName,
          revealedSub: `f${fret}`,
          midiToPlay: info.midi
        }
      ],
      geometry: { type: 'arc', fromPos: openStringPos, toPos: info.pos },
      doneCenterPrimary: noteName,
      doneCenterSub: `${strLabel} string f${fret}`,
      explanation: `${strLabel} string, fret ${fret} is ${noteName}.`
    };
  }

  if (kind === 'neck_to_interval') {
    const { stringIndex, fret, symbol } = params;
    const info = getBassFretInfo(stringIndex, fret);
    const iv = INTERVALS[symbol];
    const strLabel = notation === 'letter' ? info.stringLetter : info.stringSolfege;
    const rootSpelled = chooseBestRootSpelling(info.pos, [symbol]);
    const targetSpelled = spellInterval(rootSpelled, symbol);
    const rootName = formatSpelledNote(rootSpelled, notation);
    const targetName = formatSpelledNote(targetSpelled, notation);
    const nodes = makeNoteWheelNodes(notation, { isBlind });

    return {
      id: card.id,
      category: 'fretboard',
      answerSurface: 'circle',
      eyebrow: `NECK → HARMONY · ${strLabel.toUpperCase()} FRET ${fret}`,
      promptHtml: `Tap the <b>${iv.name}</b> <span class="q-badge">${symbol}</span> of this fret`,
      staff: null,
      fretboard: {
        mode: 'single',
        stringIndex,
        fret
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
      revealExtraNodes: [{ pos: info.pos, mode: 'anchor', primary: rootName, subBadge: `f${fret}` }],
      geometry: { type: 'arc', fromPos: info.pos, toPos: targetSpelled.pos },
      doneCenterPrimary: targetName,
      doneCenterSub: `${rootName} → ${targetName}`,
      explanation: `${strLabel} fret ${fret} is ${rootName}; its ${iv.name} (${symbol}) is ${targetName} (${formatCircleStepDelta(iv.circleOffset)}).`
    };
  }

  // 8C. Reverse: Circle -> Find Target Note Across ALL 4 Bass Strings!
  if (kind === 'circle_to_all_strings') {
    const { targetPos, harmonicFrom } = params;
    const targetPc = posToPitchClass(targetPos);

    let targetName = getCanonicalNoteName(targetPos, notation);
    let promptHtml = '';
    const highlightMap = {};
    let geo = { type: 'none' };

    if (harmonicFrom) {
      const { rootPos, sym } = harmonicFrom;
      const iv = INTERVALS[sym];
      const rootSpelled = chooseBestRootSpelling(rootPos, [sym]);
      const tSpelled = spellInterval(rootSpelled, sym);
      const rootName = formatSpelledNote(rootSpelled, notation);
      targetName = formatSpelledNote(tSpelled, notation);

      highlightMap[rootPos] = { mode: 'anchor', primary: rootName, subBadge: '1', showEvenWhenBlind: true };
      highlightMap[targetPos] = {
        mode: 'placed',
        primary: isBlind ? '?' : targetName,
        subBadge: sym,
        showEvenWhenBlind: true
      };
      promptHtml = `Find <b>${iv.name} (${sym})</b> of <b>${rootName}</b> on all 4 strings`;
      geo = { type: 'arc', fromPos: rootPos, toPos: targetPos };
    } else {
      highlightMap[targetPos] = {
        mode: 'anchor',
        primary: targetName,
        subBadge: '4 strings',
        showEvenWhenBlind: true
      };
      promptHtml = `Tap <b>${targetName}</b> on all <b>4 bass strings</b>`;
    }

    const nodes = makeNoteWheelNodes(notation, { isBlind, highlightMap });

    // Compute canonical fret (0..11) on each of the 4 strings for explanation & Show button
    const canonicalFrets = BASS_STRINGS.map((str) => {
      const f = mod(targetPc - str.pc, 12);
      const sLbl = notation === 'letter' ? str.letter : str.solfege;
      return { stringIndex: str.index, fret: f, strLabel: sLbl, midi: str.openMidi + f };
    });

    const fretSummary = canonicalFrets.map((x) => `${x.strLabel}:${x.fret}`).join(' · ');

    return {
      id: card.id,
      category: 'fretboard',
      answerSurface: 'fretboard',
      targetPos,
      targetPc,
      targetName,
      canonicalFrets,
      eyebrow: 'CIRCLE → ALL 4 BASS STRINGS',
      promptHtml,
      staff: null,
      fretboard: {
        mode: 'all4'
      },
      initialGeometry: geo,
      nodes,
      steps: canonicalFrets.map((cf) => ({
        targetPos,
        stepChipLabel: cf.strLabel,
        revealedPrimary: targetName,
        midiToPlay: cf.midi
      })),
      geometry: geo,
      doneCenterPrimary: targetName,
      doneCenterSub: '4 / 4 strings',
      explanation: `${targetName} across the 4 strings: ${fretSummary}.`
    };
  }

  throw new Error(`Unhandled quiz kind: ${kind}`);
}
