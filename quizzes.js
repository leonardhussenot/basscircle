// BassCircle v4 — 100% Procedural System-Based Curriculum + Dedicated D & G Upper-Neck Mastery
// Every card represents a *reusable musical skill* (never a memorized static note pair):
// roots, keys, frets, and anchors randomize freshly on every single appearance!

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
  { id: 'intervals', label: 'Intervals', desc: 'Randomized intervals, chromatic & degree math' },
  { id: 'clef', label: 'Clé de Fa', desc: 'Sight-read bass clef 𝄢 onto the Circle' },
  { id: 'chords', label: 'Chords', desc: 'Constellations, slash chords & relatives' },
  { id: 'bass', label: 'Grooves', desc: '7→3 voice-leading, walks & stage bridge' },
  { id: 'fretboard', label: 'Fretboard', desc: 'Full 4-string shapes, frets & walks' },
  { id: 'highstrings', label: 'Ré · Sol', desc: 'Zero-deduction D & G upper-strings mastery' }
];

const ALL_12 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const NON_ZERO_11 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

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

function pickFrom(arr, rand, avoidSet = null) {
  if (avoidSet && avoidSet.size > 0) {
    const filtered = arr.filter((x) => !avoidSet.has(x));
    if (filtered.length > 0) {
      return filtered[Math.floor(rand() * filtered.length)];
    }
  }
  return arr[Math.floor(rand() * arr.length)];
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
 * Canonical Procedural Skill Deck (96 distinct musical skills across 8 categories).
 * None of these hardcode a single static root note — every skill generates a fresh
 * root/key/fret each time it is practiced!
 */
export function buildCanonicalDeckDefinitions() {
  return [
    // =======================================================================
    // 1. NOTES (Blank Circle Notes & Bilingual Reflex — 10 Skills)
    // =======================================================================
    { id: 'skill_note_spot_sharp', category: 'notes', kind: 'note_spot_pool', params: { pool: [1, 2, 3, 4, 5, 6], cross: false } },
    { id: 'skill_note_spot_flat', category: 'notes', kind: 'note_spot_pool', params: { pool: [6, 7, 8, 9, 10, 11], preferFlat: true, cross: false } },
    { id: 'skill_note_spot_any', category: 'notes', kind: 'note_spot_pool', params: { pool: ALL_12, cross: false } },
    { id: 'skill_note_bilingual_nat', category: 'notes', kind: 'note_spot_pool', params: { pool: [0, 1, 2, 3, 4, 5, 11], cross: true } },
    { id: 'skill_note_bilingual_acc', category: 'notes', kind: 'note_spot_pool', params: { pool: [6, 7, 8, 9, 10], preferFlat: true, cross: true } },
    { id: 'skill_note_quad_rotated', category: 'notes', kind: 'note_quad_random', params: {} },
    { id: 'skill_note_sweep_sharps', category: 'notes', kind: 'note_sweep', params: { mode: 'sharps' } },
    { id: 'skill_note_sweep_flats', category: 'notes', kind: 'note_sweep', params: { mode: 'flats' } },
    { id: 'skill_note_walk_from_any', category: 'notes', kind: 'note_walk_random', params: {} },
    { id: 'skill_note_sweep_all12', category: 'notes', kind: 'note_sweep', params: { mode: 'all12' } },

    // =======================================================================
    // 2. DEGREES (Blank Circle Numeric Degrees around Random `1` — 12 Skills)
    // =======================================================================
    { id: 'skill_deg_spot_3', category: 'degrees', kind: 'deg_spot', params: { symbols: ['3'] } },
    { id: 'skill_deg_spot_b3', category: 'degrees', kind: 'deg_spot', params: { symbols: ['♭3'] } },
    { id: 'skill_deg_spot_b7_7', category: 'degrees', kind: 'deg_spot', params: { symbols: ['♭7', '7'] } },
    { id: 'skill_deg_spot_6_b6', category: 'degrees', kind: 'deg_spot', params: { symbols: ['6', '♭6'] } },
    { id: 'skill_deg_spot_2_b2', category: 'degrees', kind: 'deg_spot', params: { symbols: ['2', '♭2'] } },
    { id: 'skill_deg_spot_4_5_b5', category: 'degrees', kind: 'deg_spot', params: { symbols: ['4', '5', '♭5', '♯4'] } },
    { id: 'skill_deg_fill_major', category: 'degrees', kind: 'deg_multi', params: { preset: 'maj_shuf' } },
    { id: 'skill_deg_fill_minor', category: 'degrees', kind: 'deg_multi', params: { preset: 'min_shuf' } },
    { id: 'skill_deg_fill_dorian', category: 'degrees', kind: 'deg_multi', params: { preset: 'dorian' } },
    { id: 'skill_deg_fill_7th_chord', category: 'degrees', kind: 'deg_multi', params: { preset: 'random_7th' } },
    { id: 'skill_deg_fill_penta_blues', category: 'degrees', kind: 'deg_multi', params: { preset: 'penta_blues' } },
    { id: 'skill_deg_fill_chromatic12', category: 'degrees', kind: 'deg_multi', params: { preset: 'chromatic12' } },

    // =======================================================================
    // 3. INTERVALS & DEGREE MATH (100% Randomized Root Every Time — 14 Skills)
    // =======================================================================
    { id: 'skill_iv_note_3', category: 'intervals', kind: 'interval_of_note', params: { symbol: '3' } },
    { id: 'skill_iv_note_b3', category: 'intervals', kind: 'interval_of_note', params: { symbol: '♭3' } },
    { id: 'skill_iv_note_b7', category: 'intervals', kind: 'interval_of_note', params: { symbol: '♭7' } },
    { id: 'skill_iv_note_7', category: 'intervals', kind: 'interval_of_note', params: { symbol: '7' } },
    { id: 'skill_iv_note_6', category: 'intervals', kind: 'interval_of_note', params: { symbol: '6' } },
    { id: 'skill_iv_note_b6', category: 'intervals', kind: 'interval_of_note', params: { symbol: '♭6' } },
    { id: 'skill_iv_note_b5', category: 'intervals', kind: 'interval_of_note', params: { symbol: '♭5' } },
    { id: 'skill_iv_note_2_b2', category: 'intervals', kind: 'interval_of_note_pool', params: { symbols: ['2', '♭2'] } },
    { id: 'skill_iv_blind_4_5', category: 'intervals', kind: 'interval_of_note_pool', params: { symbols: ['4', '5'], forceBlind: true } },
    { id: 'skill_chrom_below', category: 'intervals', kind: 'chromatic_approach', params: { direction: 'below' } },
    { id: 'skill_chrom_above', category: 'intervals', kind: 'chromatic_approach', params: { direction: 'above' } },
    { id: 'skill_deg_math_3rds', category: 'intervals', kind: 'interval_of_degree_numeric', params: { group: '3rds' } },
    { id: 'skill_deg_math_7ths_5ths', category: 'intervals', kind: 'interval_of_degree_numeric', params: { group: '7ths_5ths' } },
    { id: 'skill_deg_math_inkey', category: 'intervals', kind: 'interval_of_degree_inkey', params: {} },

    // =======================================================================
    // 4. CLÉ DE FA (𝄢 Bass Clef Sight-Reading — 10 Procedural Skills)
    // =======================================================================
    { id: 'skill_clef_landmarks', category: 'clef', kind: 'clef_landmarks', params: {} },
    { id: 'skill_clef_low_nat', category: 'clef', kind: 'clef_random_note', params: { minStep: -2, maxStep: 4, accPool: [0] } },
    { id: 'skill_clef_high_nat', category: 'clef', kind: 'clef_random_note', params: { minStep: 4, maxStep: 12, accPool: [0] } },
    { id: 'skill_clef_ledger_focus', category: 'clef', kind: 'clef_ledger_focus', params: {} },
    { id: 'skill_clef_sharps', category: 'clef', kind: 'clef_random_note', params: { minStep: -1, maxStep: 11, accPool: [1] } },
    { id: 'skill_clef_flats', category: 'clef', kind: 'clef_random_note', params: { minStep: -1, maxStep: 11, accPool: [-1] } },
    { id: 'skill_clef_keysig_sharps', category: 'clef', kind: 'clef_keysig_note', params: { sign: '♯' } },
    { id: 'skill_clef_keysig_flats', category: 'clef', kind: 'clef_keysig_note', params: { sign: '♭' } },
    { id: 'skill_clef_riff_triad', category: 'clef', kind: 'clef_riff_procedural', params: { style: 'triad' } },
    { id: 'skill_clef_riff_walk', category: 'clef', kind: 'clef_riff_procedural', params: { style: 'walk' } },

    // =======================================================================
    // 5. CHORDS (Constellations, Slash Chords & Relatives — 12 Skills)
    // =======================================================================
    { id: 'skill_const_dom7', category: 'chords', kind: 'constellation_root', params: { quality: 'Dom7', suffix: '7', degrees: ['1', '3', '5', '♭7'] } },
    { id: 'skill_const_m7', category: 'chords', kind: 'constellation_root', params: { quality: 'm7', suffix: 'm7', degrees: ['1', '♭3', '5', '♭7'] } },
    { id: 'skill_const_maj7', category: 'chords', kind: 'constellation_root', params: { quality: 'Maj7', suffix: 'Maj7', degrees: ['1', '3', '5', '7'] } },
    { id: 'skill_const_m7b5', category: 'chords', kind: 'constellation_root', params: { quality: 'm7♭5', suffix: 'm7♭5', degrees: ['1', '♭3', '♭5', '♭7'] } },
    { id: 'skill_slash_to_deg_3rds', category: 'chords', kind: 'slash_to_degree', params: { group: '3rds' } },
    { id: 'skill_slash_to_deg_7ths_5ths', category: 'chords', kind: 'slash_to_degree', params: { group: '7ths_5ths' } },
    { id: 'skill_inv_1st_maj_min', category: 'chords', kind: 'inversion_to_note', params: { inv: '1st' } },
    { id: 'skill_inv_3rd_7th', category: 'chords', kind: 'inversion_to_note', params: { inv: '3rd' } },
    { id: 'skill_rel_minor', category: 'chords', kind: 'rel_minor', params: {} },
    { id: 'skill_rel_major', category: 'chords', kind: 'rel_major', params: {} },
    { id: 'skill_keysig_major', category: 'chords', kind: 'key_sig', params: { mode: 'major' } },
    { id: 'skill_keysig_minor', category: 'chords', kind: 'key_sig', params: { mode: 'minor' } },

    // =======================================================================
    // 6. GROOVES (Voice-Leading, Turnarounds & Stage Bridge — 12 Skills)
    // =======================================================================
    { id: 'skill_vl_ii_V', category: 'bass', kind: 'voice_leading', params: { pair: 'ii-V' } },
    { id: 'skill_vl_V_I', category: 'bass', kind: 'voice_leading', params: { pair: 'V-I' } },
    { id: 'skill_arp_dom7', category: 'bass', kind: 'bass_arpeggio', params: { quality: 'Dom7', suffix: '7', degrees: ['1', '3', '5', '♭7'], crossNotation: false } },
    { id: 'skill_arp_m7', category: 'bass', kind: 'bass_arpeggio', params: { quality: 'm7', suffix: 'm7', degrees: ['1', '♭3', '5', '♭7'], crossNotation: false } },
    { id: 'skill_arp_maj7', category: 'bass', kind: 'bass_arpeggio', params: { quality: 'Maj7', suffix: 'Maj7', degrees: ['1', '3', '5', '7'], crossNotation: false } },
    { id: 'skill_arp_dorian_m7b5', category: 'bass', kind: 'bass_arpeggio_modal', params: {} },
    { id: 'skill_stage_bridge_chord', category: 'bass', kind: 'bass_stage_bridge', params: {} },
    { id: 'skill_walk_ii_V_I', category: 'bass', kind: 'bass_progression', params: { prog: 'ii-V-I' } },
    { id: 'skill_walk_vi_ii_V_I', category: 'bass', kind: 'bass_progression', params: { prog: 'vi-ii-V-I' } },
    { id: 'skill_walk_I_IV_V', category: 'bass', kind: 'bass_progression', params: { prog: 'I-IV-V' } },
    { id: 'skill_tritone_sub', category: 'bass', kind: 'bass_tritone_sub', params: {} },
    { id: 'skill_guidetones_and_penta', category: 'bass', kind: 'bass_guides_or_penta', params: {} },

    // =======================================================================
    // 7. FRETBOARD (Full 4-String Neck Shapes, Reads & Walks — 12 Skills)
    // =======================================================================
    { id: 'skill_neck_read_fret', category: 'fretboard', kind: 'neck_to_note', params: { strings: [0, 1, 2, 3], frets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] } },
    { id: 'skill_neck_read_iv_3rds', category: 'fretboard', kind: 'neck_to_interval', params: { symbols: ['3', '♭3'] } },
    { id: 'skill_neck_read_iv_7ths_5ths', category: 'fretboard', kind: 'neck_to_interval', params: { symbols: ['5', '♭7', '♭5'] } },
    { id: 'skill_neck_shape_3rds', category: 'fretboard', kind: 'neck_shape_to_degree', params: { group: '3rds' } },
    { id: 'skill_neck_shape_7ths_6ths', category: 'fretboard', kind: 'neck_shape_to_degree', params: { group: '7ths_6ths' } },
    { id: 'skill_neck_shape_5ths_4ths', category: 'fretboard', kind: 'neck_shape_to_degree', params: { group: '5ths_4ths' } },
    { id: 'skill_neck_all4_note', category: 'fretboard', kind: 'circle_to_strings', params: { activeStrings: [0, 1, 2, 3], harmonic: false } },
    { id: 'skill_neck_all4_harmonic', category: 'fretboard', kind: 'circle_to_strings', params: { activeStrings: [0, 1, 2, 3], harmonic: true } },
    { id: 'skill_neck_seq_m7', category: 'fretboard', kind: 'circle_to_neck_seq', params: { mode: 'arp_m7', lockedStrings: [] } },
    { id: 'skill_neck_seq_dom7', category: 'fretboard', kind: 'circle_to_neck_seq', params: { mode: 'arp_dom7', lockedStrings: [] } },
    { id: 'skill_neck_seq_maj7', category: 'fretboard', kind: 'circle_to_neck_seq', params: { mode: 'arp_maj7', lockedStrings: [] } },
    { id: 'skill_neck_seq_iiVI', category: 'fretboard', kind: 'circle_to_neck_seq', params: { mode: 'ii-V-I', lockedStrings: [] } },

    // =======================================================================
    // 8. RÉ · SOL / D & G (Zero-Deduction Upper-Strings Mastery — 14 Skills!)
    //    E & A strings are dimmed/locked so you build direct D & G reflexes!
    // =======================================================================
    { id: 'skill_dg_read_g_string', category: 'highstrings', kind: 'neck_to_note', params: { strings: [3], frets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], lockedStrings: [0, 1, 2] } },
    { id: 'skill_dg_read_d_string', category: 'highstrings', kind: 'neck_to_note', params: { strings: [2], frets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], lockedStrings: [0, 1, 3] } },
    { id: 'skill_dg_blackhole_frets', category: 'highstrings', kind: 'neck_to_note', params: { strings: [2, 3], frets: [4, 6, 8, 9, 10, 11], lockedStrings: [0, 1] } },
    { id: 'skill_dg_same_fret_pair', category: 'highstrings', kind: 'dg_same_fret_pair', params: {} },
    { id: 'skill_dg_read_iv_upper', category: 'highstrings', kind: 'neck_to_interval', params: { strings: [2, 3], symbols: ['3', '♭3', '♭7', '5'], lockedStrings: [0, 1] } },
    { id: 'skill_dg_coldcall_g_only', category: 'highstrings', kind: 'circle_to_strings', params: { activeStrings: [3], harmonic: false } },
    { id: 'skill_dg_coldcall_d_only', category: 'highstrings', kind: 'circle_to_strings', params: { activeStrings: [2], harmonic: false } },
    { id: 'skill_dg_play_both_dg', category: 'highstrings', kind: 'circle_to_strings', params: { activeStrings: [2, 3], harmonic: false } },
    { id: 'skill_dg_harmonic_on_dg', category: 'highstrings', kind: 'circle_to_strings', params: { activeStrings: [2, 3], harmonic: true } },
    { id: 'skill_dg_harmonic_on_g_only', category: 'highstrings', kind: 'circle_to_strings', params: { activeStrings: [3], harmonic: true } },
    { id: 'skill_dg_shells_3_7', category: 'highstrings', kind: 'circle_to_neck_seq', params: { mode: 'shells_3_7', lockedStrings: [0, 1] } },
    { id: 'skill_dg_arp_m7_upper', category: 'highstrings', kind: 'circle_to_neck_seq', params: { mode: 'arp_m7', lockedStrings: [0, 1] } },
    { id: 'skill_dg_arp_dom7_upper', category: 'highstrings', kind: 'circle_to_neck_seq', params: { mode: 'arp_dom7', lockedStrings: [0, 1] } },
    { id: 'skill_dg_walk_iiVI_upper', category: 'highstrings', kind: 'circle_to_neck_seq', params: { mode: 'ii-V-I', lockedStrings: [0, 1] } }
  ];
}

const DECK_MAP = new Map(
  buildCanonicalDeckDefinitions().map((d) => [d.id, d])
);

export function getDefinitionById(id) {
  return DECK_MAP.get(id) || null;
}

function makeNoteWheelNodes(notation, { isBlind = false, highlightMap = {} } = {}) {
  return Array.from({ length: 12 }, (_, pos) => {
    const std = getStandardNodeLabel(pos, notation);
    const hl = highlightMap[pos];

    if (isBlind) {
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

function makeBlankNoteNodes(notation, visiblePositions = []) {
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
  return (card.stability || 0) >= 2.8;
}

/**
 * Instantiates a fresh, procedurally randomized question from a skill card.
 * `avoidPositions` prevents consecutive questions from repeating the same root/note!
 */
export function instantiateQuiz(
  card,
  notation = 'solfege',
  seed = null,
  { blindMode = 'auto', avoidPositions = [] } = {}
) {
  const def = DECK_MAP.get(card.id);
  if (!def) {
    throw new Error(`Unknown card definition: ${card.id}`);
  }
  const rand = seed !== null ? createRng(seed) : Math.random;
  const avoidSet = new Set(avoidPositions);
  const { kind, params, category } = def;
  const isBlind = shouldUseBlindWheel(card, blindMode, Boolean(params.forceBlind));

  // =========================================================================
  // 1. NOTES (C / Do is ALWAYS 12h — zero anchor needed on the blank wheel!)
  // =========================================================================
  if (kind === 'note_spot_pool') {
    const targetPos = pickFrom(params.pool, rand, avoidSet);
    const preferFlat = Boolean(params.preferFlat);
    const cross = Boolean(params.cross);
    const promptNotation = cross ? oppositeNotation(notation) : notation;
    const promptNote = getCanonicalNoteName(targetPos, promptNotation, preferFlat);
    const circleNote = getCanonicalNoteName(targetPos, notation, preferFlat);
    const doName = getCanonicalNoteName(0, notation);
    const nodes = makeBlankNoteNodes(notation);
    const stepDelta = formatCircleStepDelta(targetPos);

    return {
      id: card.id,
      category,
      primaryRootPos: targetPos,
      answerSurface: 'circle',
      eyebrow: cross ? 'STAGE BRIDGE · BLANK CIRCLE' : 'BLANK CIRCLE · NOTES',
      promptHtml: cross
        ? `Chart says <b>${promptNote}</b> · place on Circle`
        : `Place <b>${promptNote}</b> on the Circle`,
      staff: null,
      fretboard: null,
      nodes,
      steps: [
        {
          targetPos,
          centerLabel: promptNote,
          centerSub: cross ? 'Translate & tap' : 'Tap position',
          stepChipLabel: promptNote,
          revealedPrimary: circleNote,
          revealedSub: cross ? promptNote : '',
          midiToPlay: bassMidiForPos(targetPos, 36)
        }
      ],
      revealExtraNodes:
        targetPos !== 0
          ? [{ pos: 0, mode: 'source', primary: doName, subBadge: '12h' }]
          : [],
      geometry: { type: 'arc', fromPos: 0, toPos: targetPos },
      doneCenterPrimary: circleNote,
      doneCenterSub: cross ? `= ${promptNote}` : stepDelta,
      explanation:
        targetPos === 0
          ? `${circleNote} is always fixed at 12 o’clock.`
          : cross
          ? `${promptNote} = ${circleNote} (${stepDelta} from 12h ${doName}).`
          : `${circleNote} lives at ${stepDelta} from 12h ${doName}.`
    };
  }

  if (kind === 'note_quad_random') {
    const firstPos = pickFrom(ALL_12, rand, avoidSet);
    const restPool = ALL_12.filter((p) => p !== firstPos);
    const picked = [firstPos, ...shuffle(restPool, rand).slice(0, 3)];
    const nodes = makeBlankNoteNodes(notation);
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
      category,
      primaryRootPos: firstPos,
      answerSurface: 'circle',
      eyebrow: 'BLANK CIRCLE · 4 NOTES',
      promptHtml: `Place <b>4 random notes</b> on the Circle`,
      staff: null,
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'polygon', positions: picked },
      doneCenterPrimary: '4 / 4',
      doneCenterSub: 'Locked in',
      explanation: `${getCanonicalNoteName(0, notation)} is always 12h; clockwise = +5ths, CCW = +4ths.`
    };
  }

  if (kind === 'note_walk_random') {
    const startPos = pickFrom(ALL_12, rand, avoidSet);
    const isFifths = rand() < 0.5;
    const stepDir = isFifths ? 1 : -1;
    const startName = getCanonicalNoteName(startPos, notation);
    const nodes = makeBlankNoteNodes(notation);
    const seq = [0, 1, 2, 3, 4].map((k) => mod(startPos + k * stepDir, 12));
    const steps = seq.map((p, idx) => {
      const nm = getCanonicalNoteName(p, notation, !isFifths && p === 6);
      return {
        targetPos: p,
        centerLabel: idx === 0 ? startName : isFifths ? '+5th' : '+4th',
        centerSub: `${idx + 1} / 5`,
        stepChipLabel: idx === 0 ? startName : `+${idx}`,
        revealedPrimary: nm,
        revealedSub: '',
        midiToPlay: bassMidiForPos(p, 36)
      };
    });

    return {
      id: card.id,
      category,
      primaryRootPos: startPos,
      answerSurface: 'circle',
      eyebrow: 'BLANK CIRCLE · 5THS & 4THS',
      promptHtml: isFifths
        ? `Start on <b>${startName}</b> · walk <b>CW in 5ths</b> (5 notes)`
        : `Start on <b>${startName}</b> · walk <b>CCW in 4ths</b> (5 notes)`,
      staff: null,
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'walk', positions: seq },
      doneCenterPrimary: '5 / 5',
      doneCenterSub: isFifths ? '+5ths CW' : '+4ths CCW',
      explanation: isFifths
        ? `Walking clockwise in 5ths starting at ${startName}: ${steps.map((s) => s.revealedPrimary).join(' → ')}.`
        : `Walking CCW in 4ths starting at ${startName}: ${steps.map((s) => s.revealedPrimary).join(' → ')}.`
    };
  }

  if (kind === 'note_sweep') {
    const { mode } = params;
    const nodes = makeBlankNoteNodes(notation);
    let seq = [];
    let title = '';
    if (mode === 'sharps') {
      seq = shuffle([1, 2, 3, 4, 5, 6], rand);
      title = 'Place the <b>6 sharp-side</b> notes';
    } else if (mode === 'flats') {
      seq = shuffle([11, 10, 9, 8, 7, 6], rand);
      title = 'Place the <b>6 flat-side</b> notes';
    } else {
      seq = shuffle(ALL_12, rand);
      title = 'Fill <b>all 12 notes</b> around the Circle';
    }
    const preferFlat = mode === 'flats';
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
      category,
      primaryRootPos: seq[0],
      answerSurface: 'circle',
      eyebrow: 'FILL THE CIRCLE · NOTES',
      promptHtml: title,
      staff: null,
      fretboard: null,
      nodes,
      steps,
      geometry: { type: 'walk', positions: seq },
      doneCenterPrimary: `${seq.length} / ${seq.length}`,
      doneCenterSub: 'Circle mapped',
      explanation: `${getCanonicalNoteName(0, notation)} is fixed at 12h · right = sharps (+5ths CW), left = flats (+4ths CCW).`
    };
  }

  // =========================================================================
  // 2. DEGREES
  // =========================================================================
  if (kind === 'deg_spot') {
    const symbol = pickFrom(params.symbols, rand);
    const iv = INTERVALS[symbol];
    const rootPos = pickFrom(ALL_12, rand, avoidSet);
    const targetPos = mod(rootPos + iv.circleOffset, 12);
    const showName = rand() < 0.5;
    const nodes = makeBlankDegreeNodes(rootPos);
    const stepDelta = formatCircleStepDelta(iv.circleOffset);

    return {
      id: card.id,
      category,
      primaryRootPos: rootPos,
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
    let { preset } = params;
    if (preset === 'random_7th') {
      preset = pickFrom(['dom7', 'm7', 'maj7', 'm7b5'], rand);
    } else if (preset === 'penta_blues') {
      preset = rand() < 0.5 ? 'penta_min' : 'blues';
    }

    const rootPos = pickFrom(ALL_12, rand, avoidSet);
    const nodes = makeBlankDegreeNodes(rootPos);
    let degList = [];
    let title = '';
    let takeaway = '';

    if (preset === 'maj_shuf') {
      degList = shuffle(['2', '3', '4', '5', '6', '7'], rand);
      title = 'Place <b>Major Scale</b> degrees';
      takeaway = 'Major scale forms 7 contiguous slices: 4 (−1 CCW) through 7 (+5 CW).';
    } else if (preset === 'min_shuf') {
      degList = shuffle(['2', '♭3', '4', '5', '♭6', '♭7'], rand);
      title = 'Place <b>Natural Minor</b> degrees';
      takeaway = 'Natural minor is 7 contiguous slices from ♭6 (−4 CCW) to 2 (+2 CW).';
    } else if (preset === 'dorian') {
      degList = shuffle(['2', '♭3', '4', '5', '6', '♭7'], rand);
      title = 'Place <b>Dorian</b> funk degrees';
      takeaway = 'Dorian is mirror-symmetric around 1: −3 (♭3) through +3 (6)!';
    } else if (preset === 'dom7') {
      degList = ['3', '5', '♭7'];
      title = 'Place <b>Dom7</b> degrees <span class="q-sub">(3 · 5 · ♭7)</span>';
      takeaway = 'Dom7 combines +4 CW (3), +1 CW (5), and −2 CCW (♭7).';
    } else if (preset === 'm7') {
      degList = ['♭3', '5', '♭7'];
      title = 'Place <b>Minor 7th</b> degrees <span class="q-sub">(♭3 · 5 · ♭7)</span>';
      takeaway = 'm7: ♭3 (−3 CCW), 5 (+1 CW), ♭7 (−2 CCW).';
    } else if (preset === 'maj7') {
      degList = ['3', '5', '7'];
      title = 'Place <b>Maj7</b> degrees <span class="q-sub">(3 · 5 · 7)</span>';
      takeaway = 'Maj7 lives entirely on the clockwise side: 1, 5 (+1), 3 (+4), 7 (+5).';
    } else if (preset === 'm7b5') {
      degList = ['♭3', '♭5', '♭7'];
      title = 'Place <b>m7♭5</b> degrees <span class="q-sub">(♭3 · ♭5 · ♭7)</span>';
      takeaway = 'm7♭5 combines ♭3 (−3 CCW), ♭5 (opposite), and ♭7 (−2 CCW).';
    } else if (preset === 'penta_min') {
      degList = shuffle(['♭3', '4', '5', '♭7'], rand);
      title = 'Place <b>Minor Pentatonic</b> degrees';
      takeaway = 'Minor pentatonic is 5 adjacent slices: ♭3, ♭7, 4, 1, 5!';
    } else if (preset === 'chromatic12') {
      degList = shuffle(['♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'], rand);
      title = 'Fill <b>all 12 chromatic</b> degrees';
      takeaway = 'Every chromatic interval has a fixed geometric address relative to 1.';
    } else {
      degList = shuffle(['♭3', '3', '4', '♭5', '5', '♭7'], rand);
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
      category,
      primaryRootPos: rootPos,
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

  // =========================================================================
  // 3. INTERVALS, CHROMATIC APPROACHES & DEGREE MATH (Fresh Root Every Time!)
  // =========================================================================
  if (kind === 'interval_of_note' || kind === 'interval_of_note_pool') {
    const symbol = kind === 'interval_of_note' ? params.symbol : pickFrom(params.symbols, rand);
    const rootPos = pickFrom(ALL_12, rand, avoidSet);
    const iv = INTERVALS[symbol];
    const rootSpelled = chooseBestRootSpelling(rootPos, [symbol]);
    const rawTarget = spellInterval(rootSpelled, symbol);
    const targetSpelled =
      symbol === '♭5' || Math.abs(rawTarget.acc) >= 2
        ? toPracticalEnharmonic(rawTarget)
        : rawTarget;
    const rootName = formatSpelledNote(rootSpelled, notation);
    const targetName = formatSpelledNote(targetSpelled, notation);
    const targetPos = targetSpelled.pos;

    const nodes = makeNoteWheelNodes(notation, {
      isBlind,
      highlightMap: isBlind
        ? {}
        : { [rootPos]: { mode: 'anchor', primary: rootName, secondary: '', subBadge: '1' } }
    });
    const stepDelta = formatCircleStepDelta(iv.circleOffset);

    return {
      id: card.id,
      category,
      primaryRootPos: rootPos,
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
      revealExtraNodes:
        isBlind && rootPos !== targetPos
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
    const destPos = pickFrom(ALL_12, rand, avoidSet);
    const isBelow = params.direction === 'below';
    const ivSym = isBelow ? '7' : '♭2';
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
      category,
      primaryRootPos: destPos,
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
    const pairs3rds = [
      { src: '4', iv: '3', result: '6', chordHint: 'IV chord' },
      { src: '5', iv: '3', result: '7', chordHint: 'V chord' },
      { src: '2', iv: '♭3', result: '4', chordHint: 'ii chord' },
      { src: '6', iv: '♭3', result: '1', chordHint: 'vi chord' },
      { src: '3', iv: '♭3', result: '5', chordHint: 'iii chord' },
      { src: '2', iv: '3', result: '♯4', chordHint: 'II7 (V/V)' },
      { src: '♭7', iv: '3', result: '2', chordHint: '♭VII chord' },
      { src: '♭6', iv: '3', result: '1', chordHint: '♭VI chord' },
      { src: '♭3', iv: '3', result: '5', chordHint: '♭III chord' }
    ];
    const pairs7ths5ths = [
      { src: '5', iv: '♭7', result: '4', chordHint: 'V7 guide tone' },
      { src: '2', iv: '♭7', result: '1', chordHint: 'ii7 chord' },
      { src: '6', iv: '♭7', result: '5', chordHint: 'vi7 chord' },
      { src: '4', iv: '7', result: '3', chordHint: 'IVmaj7 chord' },
      { src: '5', iv: '5', result: '2', chordHint: 'V chord' },
      { src: '2', iv: '5', result: '6', chordHint: 'ii chord' },
      { src: '6', iv: '5', result: '3', chordHint: 'vi chord' }
    ];
    const chosen = pickFrom(params.group === '3rds' ? pairs3rds : pairs7ths5ths, rand);
    const { src, iv: ivSym, result, chordHint } = chosen;
    const srcIv = INTERVALS[src];
    const hopIv = INTERVALS[ivSym];
    const rootPos = pickFrom(ALL_12, rand, avoidSet);
    const srcPos = mod(rootPos + srcIv.circleOffset, 12);
    const targetPos = mod(srcPos + hopIv.circleOffset, 12);
    const nodes = makeLabeledDegreeNodes(rootPos, srcPos, isBlind);
    const hopDelta = formatCircleStepDelta(hopIv.circleOffset);

    return {
      id: card.id,
      category,
      primaryRootPos: rootPos,
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
    const templates = [
      { roman: 'IV', srcSym: '4', iv: '3' },
      { roman: 'V', srcSym: '5', iv: '3' },
      { roman: 'V7', srcSym: '5', iv: '♭7' },
      { roman: 'ii', srcSym: '2', iv: '♭3' },
      { roman: 'ii7', srcSym: '2', iv: '♭7' },
      { roman: 'vi', srcSym: '6', iv: '♭3' },
      { roman: 'vi', srcSym: '6', iv: '5' },
      { roman: 'IVmaj7', srcSym: '4', iv: '7' }
    ];
    const { roman, srcSym, iv: ivSym } = pickFrom(templates, rand);
    // Avoidpos 5/6/7 where double-accidentals can occur on V-of-3rd
    const keyPos = pickFrom([0, 1, 2, 3, 4, 8, 9, 10, 11], rand, avoidSet);
    const hopIv = INTERVALS[ivSym];

    const keySpelled = chooseBestRootSpelling(keyPos, [srcSym]);
    const chordRootSpelled = spellInterval(keySpelled, srcSym);
    const targetSpelled = toPracticalEnharmonic(spellInterval(chordRootSpelled, ivSym));

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
      category,
      primaryRootPos: keyPos,
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

  // =========================================================================
  // 4. CLÉ DE FA (𝄢 Procedural Sight-Reading)
  // =========================================================================
  if (kind === 'clef_landmarks') {
    const landmarks = [
      { step: 6, hint: '4th line · between the 𝄢 dots (Clé de Fa anchor!)', highlightFa: true },
      { step: 10, hint: '1st ledger above · Middle C (Clé d’Ut reference!)', highlightFa: false },
      { step: -2, hint: '1st ledger below · Open low Mi / E string', highlightFa: false },
      { step: 1, hint: '1st space · Open La / A string', highlightFa: false },
      { step: 4, hint: 'Middle line (3rd) · Open Ré / D string', highlightFa: false },
      { step: 7, hint: 'Top space (4th) · Open Sol / G string', highlightFa: false }
    ];
    const lm = pickFrom(landmarks, rand);
    const noteInfo = bassStaffStepToNote(lm.step, 0);
    const noteLabel = notation === 'letter' ? noteInfo.letterName : noteInfo.solfege;
    const nodes = makeNoteWheelNodes(notation, { isBlind });

    return {
      id: card.id,
      category,
      primaryRootPos: noteInfo.pos,
      answerSurface: 'circle',
      eyebrow: 'CLÉ DE FA · LANDMARK',
      promptHtml: `Read this <b>Clé de Fa</b> landmark`,
      staff: {
        notes: [{ step: lm.step, acc: 0, showAccidental: false, state: 'active' }],
        keySig: { count: 0, sign: '' },
        highlightFaLine: lm.highlightFa
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
      geometry: { type: 'arc', fromPos: 11, toPos: noteInfo.pos },
      doneCenterPrimary: noteLabel,
      doneCenterSub: 'Clé de Fa',
      explanation: `${noteLabel} — ${lm.hint}.`
    };
  }

  if (kind === 'clef_random_note' || kind === 'clef_ledger_focus') {
    let step = 0;
    let acc = 0;
    if (kind === 'clef_ledger_focus') {
      step = pickFrom([-2, -1, 9, 10, 11, 12], rand);
      acc = pickFrom([-1, 0, 0, 1], rand);
      if (step === -2 && acc === -1) acc = 0; // keep >= E1 (MIDI 28)
    } else {
      const steps = [];
      for (let s = params.minStep; s <= params.maxStep; s++) steps.push(s);
      // Filter steps whose notepos isn't in avoidSet if possible
      const candidates = steps.filter((s) => !avoidSet.has(bassStaffStepToNote(s, params.accPool[0]).pos));
      step = (candidates.length ? candidates : steps)[Math.floor(rand() * (candidates.length || steps.length))];
      acc = pickFrom(params.accPool, rand);
    }

    // Avoid E♯/B♯/C♭/F♭ on simple inline accidental drills so reading stays idiomatic
    const rawCheck = bassStaffStepToNote(step, acc);
    if (
      (rawCheck.letter === 2 && acc === 1) ||
      (rawCheck.letter === 6 && acc === 1) ||
      (rawCheck.letter === 0 && acc === -1) ||
      (rawCheck.letter === 3 && acc === -1)
    ) {
      acc = 0;
    }

    const noteInfo = bassStaffStepToNote(step, acc);
    const noteLabel = notation === 'letter' ? noteInfo.letterName : noteInfo.solfege;
    const nodes = makeNoteWheelNodes(notation, { isBlind });

    return {
      id: card.id,
      category,
      primaryRootPos: noteInfo.pos,
      answerSurface: 'circle',
      eyebrow: 'CLÉ DE FA · SIGHT-READ',
      promptHtml: `Read this <b>Clé de Fa</b> note on the Circle`,
      staff: {
        notes: [{ step, acc, showAccidental: acc !== 0, state: 'active' }],
        keySig: { count: 0, sign: '' },
        highlightFaLine: false
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
      geometry: { type: 'arc', fromPos: 11, toPos: noteInfo.pos },
      doneCenterPrimary: noteLabel,
      doneCenterSub: 'Clé de Fa',
      explanation: `Clé de Fa: 4th line = ${getCanonicalNoteName(11, notation)}, 1st ledger above = ${getCanonicalNoteName(0, notation)}4 → ${noteLabel}.`
    };
  }

  if (kind === 'clef_keysig_note') {
    const sharpCases = [
      { step: 6, acc: 1, count: 1, keyPos: 1 },
      { step: -1, acc: 1, count: 1, keyPos: 1 },
      { step: 3, acc: 1, count: 2, keyPos: 2 },
      { step: 10, acc: 1, count: 2, keyPos: 2 },
      { step: 7, acc: 1, count: 3, keyPos: 3 },
      { step: 0, acc: 1, count: 3, keyPos: 3 },
      { step: 4, acc: 1, count: 4, keyPos: 4 },
      { step: 11, acc: 1, count: 4, keyPos: 4 }
    ];
    const flatCases = [
      { step: 2, acc: -1, count: 1, keyPos: 11 },
      { step: 9, acc: -1, count: 1, keyPos: 11 },
      { step: 5, acc: -1, count: 2, keyPos: 10 },
      { step: 12, acc: -1, count: 2, keyPos: 10 },
      { step: 1, acc: -1, count: 3, keyPos: 9 },
      { step: 8, acc: -1, count: 3, keyPos: 9 },
      { step: 4, acc: -1, count: 4, keyPos: 8 },
      { step: 11, acc: -1, count: 4, keyPos: 8 }
    ];
    const c = pickFrom(params.sign === '♯' ? sharpCases : flatCases, rand);
    const keySig = { count: c.count, sign: params.sign };
    const noteInfo = bassStaffStepToNote(c.step, c.acc);
    const noteLabel = notation === 'letter' ? noteInfo.letterName : noteInfo.solfege;
    const keyName = getCanonicalNoteName(c.keyPos, notation, params.sign === '♭');
    const nodes = makeNoteWheelNodes(notation, { isBlind });

    return {
      id: card.id,
      category,
      primaryRootPos: noteInfo.pos,
      answerSurface: 'circle',
      eyebrow: `CLÉ DE FA · KEY SIG (${keySig.count}${keySig.sign})`,
      promptHtml: `Watch the <b>key signature</b> · tap this note`,
      staff: {
        notes: [{ step: c.step, acc: c.acc, showAccidental: false, state: 'active' }],
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
      geometry: { type: 'arc', fromPos: c.keyPos, toPos: noteInfo.pos },
      doneCenterPrimary: noteLabel,
      doneCenterSub: `in ${keyName} (${keySig.count}${keySig.sign})`,
      explanation: `With ${keySig.count}${keySig.sign} (${keyName} major) at the clef, this line/space is ${noteLabel}!`
    };
  }

  if (kind === 'clef_riff_procedural') {
    const triadPool = [
      [[3, 0], [5, 0], [7, 0]],     // Do - Mi - Sol
      [[3, 0], [5, -1], [7, 0]],    // Do - Mib - Sol
      [[-1, 0], [1, 0], [3, 0]],    // Fa - La - Do
      [[-1, 0], [1, -1], [3, 0]],   // Fa - Lab - Do
      [[0, 0], [2, 0], [4, 0]],     // Sol - Si - Ré
      [[0, 0], [2, -1], [4, 0]],    // Sol - Sib - Ré
      [[1, 0], [3, 1], [5, 0]],     // La - Do# - Mi
      [[2, -1], [4, 0], [6, 0]],    // Sib - Ré - Fa
      [[5, -1], [7, 0], [9, -1]],   // Mib - Sol - Sib
      [[4, 0], [6, 1], [8, 0]]      // Ré - Fa# - La
    ];
    const walkPool = [
      [[4, 0], [6, 1], [7, 0]],     // Ré - Fa# - Sol
      [[7, 0], [9, -1], [10, 0]],   // Sol - Sib - Do
      [[0, 0], [1, 0], [2, -1]],    // Sol - La - Sib
      [[3, 0], [2, 0], [1, 0]],     // Do - Si - La
      [[6, 0], [5, 0], [4, 0]],     // Fa - Mi - Ré
      [[1, -1], [0, 0], [-1, 0]],   // Lab - Sol - Fa
      [[8, 0], [10, 1], [11, 0]],   // La - Do# - Ré
      [[5, 0], [6, 1], [7, 1]]      // Mi - Fa# - Sol# (into La)
    ];
    const rawNotes = pickFrom(params.style === 'triad' ? triadPool : walkPool, rand);
    const parsed = rawNotes.map(([step, acc]) => bassStaffStepToNote(step, acc));
    const nodes = makeNoteWheelNodes(notation, { isBlind });

    const steps = parsed.map((inf, idx) => {
      const lbl = notation === 'letter' ? inf.letterName : inf.solfege;
      return {
        targetPos: inf.pos,
        centerLabel: `Note ${idx + 1}`,
        centerSub: `${idx + 1} / 3`,
        stepChipLabel: `${idx + 1}`,
        revealedPrimary: lbl,
        revealedSub: `#${idx + 1}`,
        midiToPlay: inf.midi
      };
    });

    const summary = steps.map((s) => s.revealedPrimary).join(' → ');

    return {
      id: card.id,
      category,
      primaryRootPos: parsed[0].pos,
      answerSurface: 'circle',
      eyebrow: 'CLÉ DE FA · 3-NOTE FIGURE',
      promptHtml: `Sight-read left to right on the Circle`,
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

  // =========================================================================
  // 5. CHORDS (Constellations, Slash Chords & Relatives — Randomized Root!)
  // =========================================================================
  if (kind === 'constellation_root') {
    const { quality, suffix, degrees } = params;
    const rootPos = pickFrom(ALL_12, rand, avoidSet);
    const rootSpelled = chooseBestRootSpelling(rootPos, degrees);
    const chordName = formatChord(rootSpelled, suffix, notation);
    const rootName = formatSpelledNote(rootSpelled, notation);

    const chordMemberMap = {};
    const polyPositions = [];
    for (const sym of degrees) {
      const sp = toPracticalEnharmonic(spellInterval(rootSpelled, sym));
      polyPositions.push(sp.pos);
      chordMemberMap[sp.pos] = {
        mode: 'source',
        primary: isBlind ? '●' : formatSpelledNote(sp, notation),
        secondary: '',
        subBadge: '',
        showEvenWhenBlind: true
      };
    }

    const nodes = makeNoteWheelNodes(notation, { isBlind, highlightMap: chordMemberMap });
    const revealExtras = degrees
      .filter((sym) => sym !== '1')
      .map((sym) => {
        const sp = toPracticalEnharmonic(spellInterval(rootSpelled, sym));
        return {
          pos: sp.pos,
          mode: 'placed',
          primary: formatSpelledNote(sp, notation),
          subBadge: sym
        };
      });

    return {
      id: card.id,
      category,
      primaryRootPos: rootPos,
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
          centerLabel: 'Root?',
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
    const slashTemplates =
      params.group === '3rds'
        ? [
            { bassDeg: '3', chordQual: '' },
            { bassDeg: '♭3', chordQual: 'm' },
            { bassDeg: '3', chordQual: '7' },
            { bassDeg: '♭3', chordQual: 'm7' }
          ]
        : [
            { bassDeg: '♭7', chordQual: '7' },
            { bassDeg: '♭7', chordQual: 'm7' },
            { bassDeg: '7', chordQual: 'Maj7' },
            { bassDeg: '5', chordQual: '' },
            { bassDeg: '2', chordQual: '' }
          ];
    const { bassDeg, chordQual } = pickFrom(slashTemplates, rand);
    const rootPos = pickFrom(ALL_12, rand, avoidSet);
    const rootSpelled = chooseBestRootSpelling(rootPos, [bassDeg]);
    const bassSpelled = toPracticalEnharmonic(spellInterval(rootSpelled, bassDeg));
    const chordText = formatChord(rootSpelled, chordQual, notation);
    const bassText = formatSpelledNote(bassSpelled, notation);
    const slashSymbol = `${chordText}/${bassText}`;

    // `1` sits at `rootPos` — the chord root's true permanent home on the C-on-top Circle!
    const wheelRootPos = rootPos;
    const iv = INTERVALS[bassDeg];
    const targetPos = mod(wheelRootPos + iv.circleOffset, 12);
    const nodes = makeLabeledDegreeNodes(wheelRootPos, null, isBlind);

    return {
      id: card.id,
      category,
      primaryRootPos: rootPos,
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
    const invChoices =
      params.inv === '1st'
        ? [
            { invLabel: '1st inversion (bass on 3)', deg: '3', qual: '' },
            { invLabel: '1st inversion (bass on ♭3)', deg: '♭3', qual: 'm' }
          ]
        : [
            { invLabel: '3rd inversion (bass on ♭7)', deg: '♭7', qual: '7' },
            { invLabel: '3rd inversion (bass on ♭7)', deg: '♭7', qual: 'm7' },
            { invLabel: '3rd inversion (bass on 7)', deg: '7', qual: 'Maj7' }
          ];
    const { invLabel, deg, qual } = pickFrom(invChoices, rand);
    const rootPos = pickFrom(ALL_12, rand, avoidSet);
    const rootSpelled = chooseBestRootSpelling(rootPos, [deg]);
    const bassSpelled = toPracticalEnharmonic(spellInterval(rootSpelled, deg));
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
      category,
      primaryRootPos: rootPos,
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
    const majorPos = pickFrom(ALL_12, rand, avoidSet);
    const rootSpelled = chooseBestRootSpelling(majorPos, ['6']);
    const relMinSpelled = toPracticalEnharmonic(spellInterval(rootSpelled, '6'));
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
      category,
      primaryRootPos: majorPos,
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
    const minorPos = pickFrom(ALL_12, rand, avoidSet);
    const minSpelled = CIRCLE_POSITIONS[minorPos].minorAtThisPos;
    const majPos = mod(minorPos - 3, 12);
    const majSpelled = toPracticalEnharmonic(spellInterval(minSpelled, '♭3'));
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
      category,
      primaryRootPos: minorPos,
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
    const isMinor = params.mode === 'minor';
    const sigPool = isMinor
      ? [
          { count: 1, sign: '♯', targetPos: 4 },
          { count: 2, sign: '♯', targetPos: 5 },
          { count: 3, sign: '♯', targetPos: 6 },
          { count: 4, sign: '♯', targetPos: 7 },
          { count: 1, sign: '♭', targetPos: 2 },
          { count: 2, sign: '♭', targetPos: 1 },
          { count: 3, sign: '♭', targetPos: 0 },
          { count: 4, sign: '♭', targetPos: 11 }
        ]
      : [
          { count: 1, sign: '♯', targetPos: 1 },
          { count: 2, sign: '♯', targetPos: 2 },
          { count: 3, sign: '♯', targetPos: 3 },
          { count: 4, sign: '♯', targetPos: 4 },
          { count: 5, sign: '♯', targetPos: 5 },
          { count: 1, sign: '♭', targetPos: 11 },
          { count: 2, sign: '♭', targetPos: 10 },
          { count: 3, sign: '♭', targetPos: 9 },
          { count: 4, sign: '♭', targetPos: 8 },
          { count: 5, sign: '♭', targetPos: 7 }
        ];
    const filtered = sigPool.filter((x) => !avoidSet.has(x.targetPos));
    const { count, sign, targetPos } = (filtered.length ? filtered : sigPool)[
      Math.floor(rand() * (filtered.length || sigPool.length))
    ];
    const sigText = `${count}${sign}`;
    const answerLabel = isMinor
      ? formatChord(CIRCLE_POSITIONS[targetPos].minorAtThisPos, 'm', notation)
      : getCanonicalNoteName(targetPos, notation, sign === '♭');

    const nodes = makeNoteWheelNodes(notation, { isBlind });

    return {
      id: card.id,
      category,
      primaryRootPos: targetPos,
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

  // =========================================================================
  // 6. GROOVES (Voice-Leading, Turnarounds & Stage Bridge — Randomized Key!)
  // =========================================================================
  if (kind === 'voice_leading') {
    const keyPos = pickFrom([0, 1, 2, 3, 4, 8, 9, 10, 11], rand, avoidSet);
    const keySpelled = chooseBestRootSpelling(keyPos, ['2', '5', '4', '7', '3']);

    let chordAName = '';
    let chordBName = '';
    let fromSpelled = null;
    let toSpelled = null;

    if (params.pair === 'ii-V') {
      const iiSpelled = spellInterval(keySpelled, '2');
      const vSpelled = spellInterval(keySpelled, '5');
      chordAName = formatChord(iiSpelled, 'm7', notation);
      chordBName = formatChord(vSpelled, '7', notation);
      fromSpelled = spellInterval(keySpelled, '1');
      toSpelled = toPracticalEnharmonic(spellInterval(keySpelled, '7'));
    } else {
      const vSpelled = spellInterval(keySpelled, '5');
      chordAName = formatChord(vSpelled, '7', notation);
      chordBName = formatChord(keySpelled, 'Maj7', notation);
      fromSpelled = spellInterval(keySpelled, '4');
      toSpelled = toPracticalEnharmonic(spellInterval(keySpelled, '3'));
    }

    const fromNote = formatSpelledNote(fromSpelled, notation);
    const toNote = formatSpelledNote(toSpelled, notation);
    const fromMidi = bassMidiForPos(fromSpelled.pos, 39);
    const toMidi = fromMidi - 1;
    const nodes = makeNoteWheelNodes(notation, { isBlind });

    return {
      id: card.id,
      category,
      primaryRootPos: keyPos,
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
          stepChipLabel: '♭7',
          revealedPrimary: fromNote,
          revealedSub: '♭7',
          midiToPlay: fromMidi
        },
        {
          targetPos: toSpelled.pos,
          centerLabel: '3',
          centerSub: `of ${chordBName}`,
          stepChipLabel: '3',
          revealedPrimary: toNote,
          revealedSub: '3',
          midiToPlay: toMidi
        }
      ],
      geometry: { type: 'arc', fromPos: fromSpelled.pos, toPos: toSpelled.pos },
      doneCenterPrimary: `${fromNote}→${toNote}`,
      doneCenterSub: '−1 fret (+5 CW)',
      explanation: `♭7 of ${chordAName} (${fromNote}) drops 1 fret (+5 CW) into 3 of ${chordBName} (${toNote}).`
    };
  }

  if (
    kind === 'bass_arpeggio' ||
    kind === 'bass_arpeggio_modal' ||
    kind === 'bass_stage_bridge'
  ) {
    let quality = params.quality;
    let suffix = params.suffix;
    let degrees = params.degrees;
    let crossNotation = Boolean(params.crossNotation);

    if (kind === 'bass_arpeggio_modal') {
      if (rand() < 0.5) {
        quality = 'Dorian';
        suffix = ' Dorian';
        degrees = ['1', '♭3', '6', '♭7'];
      } else {
        quality = 'm7♭5';
        suffix = 'm7♭5';
        degrees = ['1', '♭3', '♭5', '♭7'];
      }
    } else if (kind === 'bass_stage_bridge') {
      crossNotation = true;
      const pickedQ = pickFrom(
        [
          { quality: 'm7', suffix: 'm7', degrees: ['1', '♭3', '5', '♭7'] },
          { quality: 'Dom7', suffix: '7', degrees: ['1', '3', '5', '♭7'] },
          { quality: 'Maj7', suffix: 'Maj7', degrees: ['1', '3', '5', '7'] },
          { quality: 'm7♭5', suffix: 'm7♭5', degrees: ['1', '♭3', '♭5', '♭7'] }
        ],
        rand
      );
      quality = pickedQ.quality;
      suffix = pickedQ.suffix;
      degrees = pickedQ.degrees;
    }

    const rootPos = pickFrom(ALL_12, rand, avoidSet);
    const rootSpelled = chooseBestRootSpelling(rootPos, degrees);
    const promptNot = crossNotation ? oppositeNotation(notation) : notation;
    const promptChord = formatChord(rootSpelled, suffix, promptNot);
    const localChord = formatChord(rootSpelled, suffix, notation);
    const baseMidi = bassMidiForPos(rootPos, 33);
    const nodes = makeNoteWheelNodes(notation, { isBlind });

    const steps = degrees.map((degSym) => {
      const iv = INTERVALS[degSym];
      const sp = toPracticalEnharmonic(spellInterval(rootSpelled, degSym));
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
      category,
      primaryRootPos: rootPos,
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
    const { prog } = params;
    const keyPos = pickFrom(ALL_12, rand, avoidSet);
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
      const sp = toPracticalEnharmonic(spellInterval(rootSpelled, item.deg));
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
      category,
      primaryRootPos: keyPos,
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
    const targetKeyPos = pickFrom(ALL_12, rand, avoidSet);
    const keySpelled = chooseBestRootSpelling(targetKeyPos, ['5', '♭2']);
    const domSpelled = toPracticalEnharmonic(spellInterval(keySpelled, '5'));
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
      category,
      primaryRootPos: targetKeyPos,
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

  if (kind === 'bass_guides_or_penta') {
    const rootPos = pickFrom(ALL_12, rand, avoidSet);
    if (rand() < 0.5) {
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
        const sp = toPracticalEnharmonic(spellInterval(rootSpelled, sym));
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
        category,
        primaryRootPos: rootPos,
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
        explanation: `3 (${steps[0].revealedPrimary}) and ♭7 (${steps[1].revealedPrimary}) of ${chordName} sit diametrically opposite.`
      };
    }

    const degrees = ['1', '♭3', '4', '5', '♭7'];
    const rootSpelled = chooseBestRootSpelling(rootPos, degrees);
    const rootName = formatSpelledNote(rootSpelled, notation);
    const rootMinLabel = formatChord(rootSpelled, 'm', notation);
    const baseMidi = bassMidiForPos(rootPos, 33);
    const nodes = makeNoteWheelNodes(notation, { isBlind });

    const steps = degrees.map((sym) => {
      const iv = INTERVALS[sym];
      const sp = toPracticalEnharmonic(spellInterval(rootSpelled, sym));
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
      category,
      primaryRootPos: rootPos,
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
      explanation: `Every minor pentatonic is 5 contiguous slices (−3 CCW to +1 CW).`
    };
  }

  // =========================================================================
  // 7 & 8. FRETBOARD & D/G UPPER-STRINGS MASTERY (100% Randomized!)
  // =========================================================================
  if (kind === 'neck_to_note') {
    const lockedStrings = params.lockedStrings || [];
    const pairs = [];
    for (const s of params.strings) {
      for (const f of params.frets) {
        pairs.push([s, f, getBassFretInfo(s, f).pos]);
      }
    }
    const nonAvoid = pairs.filter((x) => !avoidSet.has(x[2]));
    const [stringIndex, fret] = (nonAvoid.length ? nonAvoid : pairs)[
      Math.floor(rand() * (nonAvoid.length || pairs.length))
    ];
    const info = getBassFretInfo(stringIndex, fret);
    const strLabel = notation === 'letter' ? info.stringLetter : info.stringSolfege;
    const noteName = getCanonicalNoteName(info.pos, notation);
    const nodes = makeNoteWheelNodes(notation, { isBlind });
    const openStringPos = [4, 3, 2, 1][stringIndex] ?? 0;

    return {
      id: card.id,
      category,
      primaryRootPos: info.pos,
      answerSurface: 'circle',
      eyebrow:
        category === 'highstrings'
          ? `UPPER NECK (${strLabel.toUpperCase()} STRING) · FRET ${fret}`
          : `NECK → CIRCLE · ${strLabel.toUpperCase()} FRET ${fret}`,
      promptHtml: `Tap this <b>${strLabel}-string</b> note on the Circle`,
      staff: null,
      fretboard: {
        mode: 'single',
        stringIndex,
        fret,
        lockedStrings
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
      explanation: `${strLabel} string, fret ${fret} is ${noteName} (no E/A octave needed!).`
    };
  }

  if (kind === 'dg_same_fret_pair') {
    const fret = pickFrom([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], rand);
    const dInfo = getBassFretInfo(2, fret);
    const gInfo = getBassFretInfo(3, fret);
    const dNote = getCanonicalNoteName(dInfo.pos, notation);
    const gNote = getCanonicalNoteName(gInfo.pos, notation);
    const dStrName = notation === 'letter' ? 'D' : 'Ré';
    const gStrName = notation === 'letter' ? 'G' : 'Sol';
    const nodes = makeNoteWheelNodes(notation, { isBlind });

    return {
      id: card.id,
      category,
      primaryRootPos: dInfo.pos,
      answerSurface: 'circle',
      eyebrow: `UPPER NECK PAIR · FRET ${fret}`,
      promptHtml: `Fret <b>${fret}</b> across <b>${dStrName} → ${gStrName}</b> · tap both on Circle`,
      staff: null,
      fretboard: {
        mode: 'pair',
        lockedStrings: [0, 1],
        root: { stringIndex: 2, fret, promptLabel: '1', doneLabel: dNote },
        target: { stringIndex: 3, fret, promptLabel: '2', doneLabel: gNote }
      },
      nodes,
      steps: [
        {
          targetPos: dInfo.pos,
          centerLabel: `${dStrName}:${fret}`,
          centerSub: '1 / 2',
          stepChipLabel: dStrName,
          revealedPrimary: dNote,
          revealedSub: `${dStrName}:${fret}`,
          midiToPlay: dInfo.midi
        },
        {
          targetPos: gInfo.pos,
          centerLabel: `${gStrName}:${fret}`,
          centerSub: '2 / 2',
          stepChipLabel: gStrName,
          revealedPrimary: gNote,
          revealedSub: `${gStrName}:${fret}`,
          midiToPlay: gInfo.midi
        }
      ],
      geometry: { type: 'arc', fromPos: dInfo.pos, toPos: gInfo.pos },
      doneCenterPrimary: `${dNote}→${gNote}`,
      doneCenterSub: `Fret ${fret} (−1 CCW)`,
      explanation: `At fret ${fret}: ${dStrName} = ${dNote}, and ${gStrName} is always 1 step CCW (+4th) = ${gNote}!`
    };
  }

  if (kind === 'neck_to_interval') {
    const strPool = params.strings || [0, 1, 2, 3];
    const lockedStrings = params.lockedStrings || [];
    const symbol = pickFrom(params.symbols, rand);
    const stringIndex = pickFrom(strPool, rand);
    const fret = pickFrom([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], rand);
    const info = getBassFretInfo(stringIndex, fret);
    const iv = INTERVALS[symbol];
    const strLabel = notation === 'letter' ? info.stringLetter : info.stringSolfege;
    const rootSpelled = chooseBestRootSpelling(info.pos, [symbol]);
    const targetSpelled = toPracticalEnharmonic(spellInterval(rootSpelled, symbol));
    const rootName = formatSpelledNote(rootSpelled, notation);
    const targetName = formatSpelledNote(targetSpelled, notation);
    const nodes = makeNoteWheelNodes(notation, { isBlind });

    return {
      id: card.id,
      category,
      primaryRootPos: info.pos,
      answerSurface: 'circle',
      eyebrow: `NECK → HARMONY · ${strLabel.toUpperCase()} FRET ${fret}`,
      promptHtml: `Tap the <b>${iv.name}</b> <span class="q-badge">${symbol}</span> of this fret`,
      staff: null,
      fretboard: {
        mode: 'single',
        stringIndex,
        fret,
        lockedStrings
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

  if (kind === 'neck_shape_to_degree') {
    const shapesByGroup = {
      '3rds': [
        { ds: 1, df: -1, sym: '3', desc: '+1 string, −1 fret = Major 3rd (3)' },
        { ds: 1, df: -2, sym: '♭3', desc: '+1 string, −2 frets = Minor 3rd (♭3)' },
        { ds: 0, df: 4, sym: '3', desc: 'Same string, +4 frets = Major 3rd (3)' },
        { ds: 0, df: 3, sym: '♭3', desc: 'Same string, +3 frets = Minor 3rd (♭3)' }
      ],
      '7ths_6ths': [
        { ds: 2, df: 0, sym: '♭7', desc: '+2 strings, same fret = Minor 7th (♭7)' },
        { ds: 2, df: 1, sym: '7', desc: '+2 strings, +1 fret = Major 7th (7)' },
        { ds: 2, df: -1, sym: '6', desc: '+2 strings, −1 fret = Major 6th / Dorian (6)' },
        { ds: 2, df: -2, sym: '♭6', desc: '+2 strings, −2 frets = Minor 6th (♭6)' }
      ],
      '5ths_4ths': [
        { ds: 1, df: 2, sym: '5', desc: '+1 string, +2 frets = Power 5th (5)' },
        { ds: -1, df: 0, sym: '5', desc: '1 string lower, same fret = 5th below (degree 5!)' },
        { ds: 1, df: 0, sym: '4', desc: '+1 string, same fret = Perfect 4th (4)' },
        { ds: 1, df: 1, sym: '♭5', desc: '+1 string, +1 fret = Tritone (♭5)' }
      ]
    };
    const sh = pickFrom(shapesByGroup[params.group], rand);
    // Randomize root string & root fret so the shape moves all over the neck!
    const validRStrings = [0, 1, 2, 3].filter((s) => s + sh.ds >= 0 && s + sh.ds <= 3);
    const rStr = pickFrom(validRStrings, rand);
    const minRFret = Math.max(2, 1 - sh.df);
    const maxRFret = Math.min(9, 11 - sh.df);
    const fretPool = [];
    for (let f = minRFret; f <= maxRFret; f++) fretPool.push(f);
    const rFret = pickFrom(fretPool, rand);
    const tStr = rStr + sh.ds;
    const tFret = rFret + sh.df;

    // Lock `1` on the Circle to the root fret's true permanent note position (`C` = 12h)!
    const iv = INTERVALS[sh.sym];
    const rootInfo = getBassFretInfo(rStr, rFret);
    const wheelRootPos = rootInfo.pos;
    const targetPos = mod(wheelRootPos + iv.circleOffset, 12);
    const nodes = makeLabeledDegreeNodes(wheelRootPos, null, isBlind);
    const targetInfo = getBassFretInfo(tStr, tFret);

    return {
      id: card.id,
      category,
      primaryRootPos: wheelRootPos,
      answerSurface: 'circle',
      eyebrow: 'NECK SHAPE → CIRCLE DEGREE',
      promptHtml: `Relative to <b>1</b>, what degree is <b>?</b> — tap on Circle`,
      staff: null,
      fretboard: {
        mode: 'shape',
        root: { stringIndex: rStr, fret: rFret },
        target: { stringIndex: tStr, fret: tFret, revealedLabel: sh.sym },
        lockedStrings: []
      },
      nodes,
      steps: [
        {
          targetPos,
          centerLabel: '?',
          centerSub: 'from 1',
          stepChipLabel: sh.sym,
          revealedPrimary: sh.sym,
          revealedSub: iv.name,
          midiToPlay: targetInfo.midi
        }
      ],
      geometry: { type: 'arc', fromPos: wheelRootPos, toPos: targetPos },
      doneCenterPrimary: sh.sym,
      doneCenterSub: iv.name,
      explanation: `${sh.desc} → ${formatCircleStepDelta(iv.circleOffset)} on the Circle.`
    };
  }

  // Circle -> Specific Target Strings (All 4 strings, D & G only, G only, or D only!)
  if (kind === 'circle_to_strings') {
    const activeStrings = params.activeStrings; // e.g. [3], [2], [2, 3], or [0, 1, 2, 3]
    const activeSet = new Set(activeStrings);
    const lockedStrings = [0, 1, 2, 3].filter((s) => !activeSet.has(s));

    let targetPos = pickFrom(ALL_12, rand, avoidSet);
    let targetName = getCanonicalNoteName(targetPos, notation);
    let promptHtml = '';
    const highlightMap = {};
    let geo = { type: 'none' };

    const strNames = activeStrings
      .map((idx) => (notation === 'letter' ? BASS_STRINGS[idx].letter : BASS_STRINGS[idx].solfege))
      .join(' & ');
    const wherePhrase =
      activeStrings.length === 4
        ? 'all <b>4 bass strings</b>'
        : activeStrings.length === 2
        ? `both <b>${strNames}</b> strings`
        : `the <b>${strNames}</b> string`;

    if (params.harmonic) {
      const sym = pickFrom(['3', '♭3', '5', '♭7', '6'], rand);
      const iv = INTERVALS[sym];
      const rootPos = pickFrom(ALL_12, rand, avoidSet);
      const rootSpelled = chooseBestRootSpelling(rootPos, [sym]);
      const tSpelled = toPracticalEnharmonic(spellInterval(rootSpelled, sym));
      const rootName = formatSpelledNote(rootSpelled, notation);
      targetPos = tSpelled.pos;
      targetName = formatSpelledNote(tSpelled, notation);

      highlightMap[rootPos] = { mode: 'anchor', primary: rootName, subBadge: '1', showEvenWhenBlind: true };
      highlightMap[targetPos] = {
        mode: 'placed',
        primary: isBlind ? '?' : targetName,
        subBadge: sym,
        showEvenWhenBlind: true
      };
      promptHtml = `Tap <b>${iv.name} (${sym})</b> of <b>${rootName}</b> on ${wherePhrase}`;
      geo = { type: 'arc', fromPos: rootPos, toPos: targetPos };
    } else {
      highlightMap[targetPos] = {
        mode: 'anchor',
        primary: targetName,
        subBadge: strNames,
        showEvenWhenBlind: true
      };
      promptHtml = `Tap <b>${targetName}</b> directly on ${wherePhrase}`;
    }

    const targetPc = posToPitchClass(targetPos);
    const nodes = makeNoteWheelNodes(notation, { isBlind, highlightMap });

    const canonicalFrets = activeStrings.map((sIdx) => {
      const str = BASS_STRINGS[sIdx];
      const f = mod(targetPc - str.pc, 12);
      const sLbl = notation === 'letter' ? str.letter : str.solfege;
      return { stringIndex: sIdx, fret: f, strLabel: sLbl, midi: str.openMidi + f };
    });

    const fretSummary = canonicalFrets.map((x) => `${x.strLabel}:${x.fret}`).join(' · ');

    return {
      id: card.id,
      category,
      primaryRootPos: targetPos,
      answerSurface: 'fretboard',
      targetPos,
      targetPc,
      targetName,
      requiredStrings: activeStrings,
      canonicalFrets,
      eyebrow:
        category === 'highstrings'
          ? `UPPER NECK COLD-CALL · ${strNames.toUpperCase()}`
          : 'CIRCLE → BASS FRETBOARD',
      promptHtml,
      staff: null,
      fretboard: {
        mode: 'all4',
        lockedStrings
      },
      initialGeometry: geo,
      nodes,
      steps: canonicalFrets.map((cf) => ({
        targetPos,
        stringIndex: cf.stringIndex,
        stepChipLabel: cf.strLabel,
        revealedPrimary: targetName,
        midiToPlay: cf.midi
      })),
      geometry: geo,
      doneCenterPrimary: targetName,
      doneCenterSub: fretSummary,
      explanation: `${targetName} on ${strNames}: ${fretSummary}.`
    };
  }

  // Sequential Fretboard + Circle Play (Arpeggios, 3+7 Shells on D&G, and ii-V-I Walks!)
  if (kind === 'circle_to_neck_seq') {
    const { mode, lockedStrings = [] } = params;
    const lockedSet = new Set(lockedStrings);
    const allowedStrings = [0, 1, 2, 3].filter((s) => !lockedSet.has(s));
    const rootPos = pickFrom(ALL_12, rand, avoidSet);
    const isUpperOnly = lockedStrings.length > 0;
    const dgLabel = notation === 'letter' ? 'D & G' : 'Ré & Sol';

    let stepSpecs = [];
    let promptHtml = '';
    let eyebrow = '';
    let geoType = 'polygon';
    let donePrimary = '';

    if (mode === 'shells_3_7') {
      const shellChoice = pickFrom(
        [
          { suffix: '7', degrees: ['3', '♭7'] },
          { suffix: 'm7', degrees: ['♭3', '♭7'] },
          { suffix: 'Maj7', degrees: ['3', '7'] }
        ],
        rand
      );
      const rootSpelled = chooseBestRootSpelling(rootPos, shellChoice.degrees);
      const chordName = formatChord(rootSpelled, shellChoice.suffix, notation);
      eyebrow = `UPPER NECK SHELLS · ${dgLabel.toUpperCase()}`;
      promptHtml = `Play <b>${shellChoice.degrees[0]} → ${shellChoice.degrees[1]}</b> shell of <b>${chordName}</b> on <b>${dgLabel}</b>`;
      geoType = 'arc';
      donePrimary = chordName;

      stepSpecs = shellChoice.degrees.map((degSym) => {
        const sp = toPracticalEnharmonic(spellInterval(rootSpelled, degSym));
        return {
          chip: degSym,
          badge: degSym,
          spelled: sp,
          noteName: formatSpelledNote(sp, notation)
        };
      });
    } else if (mode.startsWith('arp_')) {
      const arpCfg =
        mode === 'arp_m7'
          ? { suffix: 'm7', degrees: ['1', '♭3', '5', '♭7'] }
          : mode === 'arp_dom7'
          ? { suffix: '7', degrees: ['1', '3', '5', '♭7'] }
          : { suffix: 'Maj7', degrees: ['1', '3', '5', '7'] };
      const rootSpelled = chooseBestRootSpelling(rootPos, arpCfg.degrees);
      const chordName = formatChord(rootSpelled, arpCfg.suffix, notation);
      eyebrow = isUpperOnly
        ? `UPPER NECK ARPEGGIO · ${dgLabel.toUpperCase()} ONLY`
        : 'CIRCLE → NECK · ARPEGGIO';
      promptHtml = isUpperOnly
        ? `Play <b>${chordName}</b> using only <b>${dgLabel}</b>`
        : `Play <b>${chordName}</b> on the bass neck`;
      geoType = 'polygon';
      donePrimary = chordName;

      stepSpecs = arpCfg.degrees.map((degSym) => {
        const sp = toPracticalEnharmonic(spellInterval(rootSpelled, degSym));
        return {
          chip: degSym,
          badge: degSym,
          spelled: sp,
          noteName: formatSpelledNote(sp, notation)
        };
      });
    } else {
      const seq = [
        { deg: '2', roman: 'ii' },
        { deg: '5', roman: 'V' },
        { deg: '1', roman: 'I' }
      ];
      const rootSpelled = chooseBestRootSpelling(
        rootPos,
        seq.map((x) => x.deg)
      );
      const keyName = formatSpelledNote(rootSpelled, notation);
      eyebrow = isUpperOnly
        ? `UPPER NECK WALK · ${dgLabel.toUpperCase()} ONLY`
        : 'CIRCLE → NECK · BASS WALK';
      promptHtml = isUpperOnly
        ? `Walk <b>ii → V → I</b> in <b>${keyName}</b> on <b>${dgLabel}</b>`
        : `Walk <b>ii → V → I</b> in <b>${keyName}</b> on the neck`;
      geoType = 'walk';
      donePrimary = `${keyName} ii–V–I`;

      stepSpecs = seq.map((it) => {
        const sp = toPracticalEnharmonic(spellInterval(rootSpelled, it.deg));
        return {
          chip: it.roman,
          badge: it.roman,
          spelled: sp,
          noteName: formatSpelledNote(sp, notation)
        };
      });
    }

    const highlightMap = {};
    if (!isBlind || mode === 'shells_3_7') {
      highlightMap[rootPos] = {
        mode: 'anchor',
        primary: getCanonicalNoteName(rootPos, notation),
        subBadge: '1',
        showEvenWhenBlind: mode === 'shells_3_7'
      };
    }
    const nodes = makeNoteWheelNodes(notation, { isBlind, highlightMap });

    const steps = stepSpecs.map((item, idx) => {
      const pc = item.spelled.pc;
      const prefStr = allowedStrings[Math.min(allowedStrings.length - 1, idx)];
      let bestStr = prefStr;
      let bestFret = mod(pc - BASS_STRINGS[prefStr].pc, 12);
      for (const s of allowedStrings) {
        const f = mod(pc - BASS_STRINGS[s].pc, 12);
        if (f >= 1 && f <= 9) {
          bestStr = s;
          bestFret = f;
          break;
        }
      }
      return {
        targetPos: item.spelled.pos,
        targetPc: pc,
        centerLabel: item.chip,
        centerSub: isUpperOnly ? dgLabel : 'Tap on neck',
        stepChipLabel: item.chip,
        revealedPrimary: item.noteName,
        revealedSub: item.badge,
        demoString: bestStr,
        demoFret: bestFret,
        midiToPlay: BASS_STRINGS[bestStr].openMidi + bestFret
      };
    });

    const noteTrail = steps.map((s) => s.revealedPrimary).join(' → ');
    const geometry =
      geoType === 'arc' && steps.length === 2
        ? { type: 'arc', fromPos: steps[0].targetPos, toPos: steps[1].targetPos }
        : { type: geoType, positions: steps.map((s) => s.targetPos) };

    return {
      id: card.id,
      category,
      primaryRootPos: rootPos,
      answerSurface: 'fretboard_seq',
      eyebrow,
      promptHtml,
      staff: null,
      fretboard: {
        mode: 'seq',
        lockedStrings
      },
      nodes,
      steps,
      geometry,
      doneCenterPrimary: donePrimary,
      doneCenterSub: isUpperOnly ? dgLabel : 'Neck + Circle!',
      explanation: `${donePrimary}: ${noteTrail}.`
    };
  }

  throw new Error(`Unhandled quiz kind: ${kind}`);
}
