// Music theory, diatonic spelling, Circle of Fifths geometry & 4-string bass neck engine

export const LETTERS_SOLFEGE = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
export const LETTERS_ANGLO = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const NATURAL_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

export function mod(n, m = 12) {
  return ((n % m) + m) % m;
}

// Multiplication by 7 mod 12 is an involution: pos <-> pitchClass (C = 0)
export function posToPitchClass(pos) {
  return mod(pos * 7, 12);
}

export function pitchClassToPos(pc) {
  return mod(pc * 7, 12);
}

export function formatAccidental(acc) {
  if (acc === 0) return '';
  if (acc === 1) return '♯';
  if (acc === -1) return '♭';
  if (acc === 2) return '𝄪';
  if (acc === -2) return '𝄫';
  return acc > 0 ? '♯'.repeat(acc) : '♭'.repeat(-acc);
}

export function formatSpelledNote(spelled, notation = 'solfege') {
  const names = notation === 'letter' ? LETTERS_ANGLO : LETTERS_SOLFEGE;
  return `${names[spelled.letter]}${formatAccidental(spelled.acc)}`;
}

/**
 * Formats a chord or minor-key symbol cleanly in both Solfège ("Do m7", "Do m")
 * and Anglo letter notation ("Cm7", "Cm"), preventing "Do" + "m7" -> "Dom7" ambiguity!
 */
export function formatChord(spelled, suffix = '', notation = 'solfege') {
  const root = formatSpelledNote(spelled, notation);
  if (!suffix) return root;
  if (suffix.startsWith(' ')) {
    return `${root} ${suffix.trim()}`;
  }
  return notation === 'letter' ? `${root}${suffix}` : `${root} ${suffix}`;
}

/**
 * Converts theoretical white-key accidentals (Do♭/C♭, Fa♭/F♭, Mi♯/E♯, Si♯/B♯)
 * to practical lead-sheet enharmonics (Si/B, Mi/E, Fa/F, Do/C) when naming chords/tritones.
 */
export function toPracticalEnharmonic(spelled) {
  if (spelled.letter === 0 && spelled.acc === -1) return { ...spelled, letter: 6, acc: 0 }; // Do♭ -> Si
  if (spelled.letter === 3 && spelled.acc === -1) return { ...spelled, letter: 2, acc: 0 }; // Fa♭ -> Mi
  if (spelled.letter === 2 && spelled.acc === 1) return { ...spelled, letter: 3, acc: 0 };  // Mi♯ -> Fa
  if (spelled.letter === 6 && spelled.acc === 1) return { ...spelled, letter: 0, acc: 0 };  // Si♯ -> Do
  return spelled;
}

export function spelledPitchClass(spelled) {
  return mod(NATURAL_SEMITONES[spelled.letter] + spelled.acc, 12);
}

export function spelledPos(spelled) {
  return pitchClassToPos(spelledPitchClass(spelled));
}

// Canonical 12 positions around the Circle of Fifths (0 = 12 o'clock, clockwise)
export const CIRCLE_POSITIONS = [
  {
    pos: 0,
    pc: 0,
    major: { letter: 0, acc: 0 }, // Do / C
    altMajor: null,
    minor: { letter: 5, acc: 0 }, // La m / Am (at pos 3)
    minorAtThisPos: { letter: 0, acc: 0 }, // Do m / Cm (rel of Mib)
    keySig: { count: 0, sign: '' }
  },
  {
    pos: 1,
    pc: 7,
    major: { letter: 4, acc: 0 }, // Sol / G
    altMajor: null,
    minor: { letter: 2, acc: 0 }, // Mi m / Em (at pos 4)
    minorAtThisPos: { letter: 4, acc: 0 }, // Sol m / Gm (rel of Sib)
    keySig: { count: 1, sign: '♯' }
  },
  {
    pos: 2,
    pc: 2,
    major: { letter: 1, acc: 0 }, // Ré / D
    altMajor: null,
    minor: { letter: 6, acc: 0 }, // Si m / Bm (at pos 5)
    minorAtThisPos: { letter: 1, acc: 0 }, // Ré m / Dm (rel of Fa)
    keySig: { count: 2, sign: '♯' }
  },
  {
    pos: 3,
    pc: 9,
    major: { letter: 5, acc: 0 }, // La / A
    altMajor: null,
    minor: { letter: 3, acc: 1 }, // Fa♯ m / F♯m (at pos 6)
    minorAtThisPos: { letter: 5, acc: 0 }, // La m / Am (rel of Do)
    keySig: { count: 3, sign: '♯' }
  },
  {
    pos: 4,
    pc: 4,
    major: { letter: 2, acc: 0 }, // Mi / E
    altMajor: null,
    minor: { letter: 0, acc: 1 }, // Do♯ m / C♯m (at pos 7)
    minorAtThisPos: { letter: 2, acc: 0 }, // Mi m / Em (rel of Sol)
    keySig: { count: 4, sign: '♯' }
  },
  {
    pos: 5,
    pc: 11,
    major: { letter: 6, acc: 0 }, // Si / B
    altMajor: { letter: 0, acc: -1 }, // Do♭ / C♭
    minor: { letter: 4, acc: 1 }, // Sol♯ m / G♯m (at pos 8)
    minorAtThisPos: { letter: 6, acc: 0 }, // Si m / Bm (rel of Ré)
    keySig: { count: 5, sign: '♯' }
  },
  {
    pos: 6,
    pc: 6,
    major: { letter: 3, acc: 1 }, // Fa♯ / F♯
    altMajor: { letter: 4, acc: -1 }, // Sol♭ / G♭
    minor: { letter: 1, acc: 1 }, // Ré♯ m / D♯m (or Mi♭ m)
    altMinor: { letter: 2, acc: -1 }, // Mi♭ m / E♭m
    minorAtThisPos: { letter: 3, acc: 1 }, // Fa♯ m / F♯m (rel of La)
    keySig: { count: 6, sign: '♯/♭' }
  },
  {
    pos: 7,
    pc: 1,
    major: { letter: 1, acc: -1 }, // Ré♭ / D♭
    altMajor: { letter: 0, acc: 1 }, // Do♯ / C♯
    minor: { letter: 6, acc: -1 }, // Si♭ m / B♭m (at pos 10)
    minorAtThisPos: { letter: 0, acc: 1 }, // Do♯ m / C♯m (rel of Mi)
    keySig: { count: 5, sign: '♭' }
  },
  {
    pos: 8,
    pc: 8,
    major: { letter: 5, acc: -1 }, // La♭ / A♭
    altMajor: { letter: 4, acc: 1 }, // Sol♯ / G♯
    minor: { letter: 3, acc: 0 }, // Fa m / Fm (at pos 11)
    minorAtThisPos: { letter: 4, acc: 1 }, // Sol♯ m / G♯m (rel of Si)
    keySig: { count: 4, sign: '♭' }
  },
  {
    pos: 9,
    pc: 3,
    major: { letter: 2, acc: -1 }, // Mi♭ / E♭
    altMajor: { letter: 1, acc: 1 }, // Ré♯ / D♯
    minor: { letter: 0, acc: 0 }, // Do m / Cm (at pos 0)
    minorAtThisPos: { letter: 2, acc: -1 }, // Mi♭ m / E♭m (rel of Sol♭)
    keySig: { count: 3, sign: '♭' }
  },
  {
    pos: 10,
    pc: 10,
    major: { letter: 6, acc: -1 }, // Si♭ / B♭
    altMajor: { letter: 5, acc: 1 }, // La♯ / A♯
    minor: { letter: 4, acc: 0 }, // Sol m / Gm (at pos 1)
    minorAtThisPos: { letter: 6, acc: -1 }, // Si♭ m / B♭m (rel of Ré♭)
    keySig: { count: 2, sign: '♭' }
  },
  {
    pos: 11,
    pc: 5,
    major: { letter: 3, acc: 0 }, // Fa / F
    altMajor: null,
    minor: { letter: 1, acc: 0 }, // Ré m / Dm (at pos 2)
    minorAtThisPos: { letter: 3, acc: 0 }, // Fa m / Fm (rel of La♭)
    keySig: { count: 1, sign: '♭' }
  }
];

/**
 * Standard label for each Circle position (used when showing the full Circle).
 * Positions 6..10 display both flat & sharp enharmonic twins stacked (e.g. Si♭ / La♯)
 * so your eye locks both names onto the same clock hour simultaneously!
 */
export function getStandardNodeLabel(pos, notation = 'solfege') {
  const entry = CIRCLE_POSITIONS[mod(pos, 12)];
  const primary = formatSpelledNote(entry.major, notation);
  if (entry.pos >= 6 && entry.pos <= 10 && entry.altMajor) {
    return {
      primary,
      secondary: formatSpelledNote(entry.altMajor, notation)
    };
  }
  return { primary, secondary: '' };
}

export function getSharpEnharmonicName(pos, notation = 'solfege') {
  const p = mod(pos, 12);
  const entry = CIRCLE_POSITIONS[p];
  if (p >= 7 && p <= 10 && entry.altMajor) {
    return formatSpelledNote(entry.altMajor, notation);
  }
  return formatSpelledNote(entry.major, notation);
}

export function getCanonicalNoteName(pos, notation = 'solfege', preferFlatAt6 = false) {
  const entry = CIRCLE_POSITIONS[mod(pos, 12)];
  if (entry.pos === 6 && preferFlatAt6 && entry.altMajor) {
    return formatSpelledNote(entry.altMajor, notation);
  }
  return formatSpelledNote(entry.major, notation);
}

// Intervals & Chromatic Degrees indexed by symbol
export const INTERVALS = {
  '1': {
    symbol: '1',
    romanMaj: 'I',
    romanMin: 'i',
    name: 'Root',
    shortName: 'Root (1)',
    degreeStep: 0,
    semitones: 0,
    circleOffset: 0,
    stepHint: 'anchor (0)'
  },
  '♭2': {
    symbol: '♭2',
    romanMaj: '♭II',
    romanMin: '♭ii',
    name: 'Minor 2nd',
    shortName: 'Minor 2nd (♭2)',
    degreeStep: 1,
    semitones: 1,
    circleOffset: 7,
    stepHint: '5 steps CCW (−5)'
  },
  '2': {
    symbol: '2',
    romanMaj: 'II',
    romanMin: 'ii',
    name: 'Major 2nd',
    shortName: 'Major 2nd (2)',
    degreeStep: 1,
    semitones: 2,
    circleOffset: 2,
    stepHint: '2 steps CW (+2)'
  },
  '♭3': {
    symbol: '♭3',
    romanMaj: '♭III',
    romanMin: '♭iii',
    name: 'Minor 3rd',
    shortName: 'Minor 3rd (♭3)',
    degreeStep: 2,
    semitones: 3,
    circleOffset: 9,
    stepHint: '3 steps CCW (−3)'
  },
  '3': {
    symbol: '3',
    romanMaj: 'III',
    romanMin: 'iii',
    name: 'Major 3rd',
    shortName: 'Major 3rd (3)',
    degreeStep: 2,
    semitones: 4,
    circleOffset: 4,
    stepHint: '4 steps CW (+4)'
  },
  '4': {
    symbol: '4',
    romanMaj: 'IV',
    romanMin: 'iv',
    name: 'Perfect 4th',
    shortName: 'Perfect 4th (4)',
    degreeStep: 3,
    semitones: 5,
    circleOffset: 11,
    stepHint: '1 step CCW (−1)'
  },
  '♯4': {
    symbol: '♯4',
    romanMaj: '♯IV',
    romanMin: '♯iv',
    name: 'Augmented 4th',
    shortName: 'Tritone (♯4)',
    degreeStep: 3,
    semitones: 6,
    circleOffset: 6,
    stepHint: 'opposite across circle (6)'
  },
  '♭5': {
    symbol: '♭5',
    romanMaj: '♭V',
    romanMin: '♭v',
    name: 'Tritone / ♭5',
    shortName: 'Tritone (♭5)',
    degreeStep: 4,
    semitones: 6,
    circleOffset: 6,
    stepHint: 'opposite across circle (6)'
  },
  '5': {
    symbol: '5',
    romanMaj: 'V',
    romanMin: 'v',
    name: 'Perfect 5th',
    shortName: 'Perfect 5th (5)',
    degreeStep: 4,
    semitones: 7,
    circleOffset: 1,
    stepHint: '1 step CW (+1)'
  },
  '♭6': {
    symbol: '♭6',
    romanMaj: '♭VI',
    romanMin: '♭vi',
    name: 'Minor 6th',
    shortName: 'Minor 6th (♭6)',
    degreeStep: 5,
    semitones: 8,
    circleOffset: 8,
    stepHint: '4 steps CCW (−4)'
  },
  '6': {
    symbol: '6',
    romanMaj: 'VI',
    romanMin: 'vi',
    name: 'Major 6th',
    shortName: 'Major 6th (6)',
    degreeStep: 5,
    semitones: 9,
    circleOffset: 3,
    stepHint: '3 steps CW (+3)'
  },
  '♭7': {
    symbol: '♭7',
    romanMaj: '♭VII',
    romanMin: '♭vii',
    name: 'Minor 7th',
    shortName: 'Minor 7th (♭7)',
    degreeStep: 6,
    semitones: 10,
    circleOffset: 10,
    stepHint: '2 steps CCW (−2)'
  },
  '7': {
    symbol: '7',
    romanMaj: 'VII',
    romanMin: 'vii°',
    name: 'Major 7th',
    shortName: 'Major 7th (7)',
    degreeStep: 6,
    semitones: 11,
    circleOffset: 5,
    stepHint: '5 steps CW (+5)'
  }
};

// Clockwise degree symbol for each offset 0..11 from tonic 1
export const OFFSET_TO_DEGREE = [
  '1',  // 0
  '5',  // 1
  '2',  // 2
  '6',  // 3
  '3',  // 4
  '7',  // 5
  '♭5', // 6 (♯4 / ♭5)
  '♭2', // 7
  '♭6', // 8
  '♭3', // 9
  '♭7', // 10
  '4'   // 11
];

/**
 * Computes exact diatonic spelling when applying `intervalSymbol` from `rootSpelled`.
 */
export function spellInterval(rootSpelled, intervalSymbol) {
  const iv = INTERVALS[intervalSymbol];
  if (!iv) throw new Error(`Unknown interval: ${intervalSymbol}`);

  const targetLetter = mod(rootSpelled.letter + iv.degreeStep, 7);
  const rootPc = spelledPitchClass(rootSpelled);
  const targetPc = mod(rootPc + iv.semitones, 12);
  const natPc = NATURAL_SEMITONES[targetLetter];

  let acc = targetPc - natPc;
  if (acc > 6) acc -= 12;
  if (acc < -6) acc += 12;

  return {
    letter: targetLetter,
    acc,
    pc: targetPc,
    pos: pitchClassToPos(targetPc)
  };
}

/**
 * Chooses the cleanest musician-friendly root spelling at `pos` for a given interval
 * so we avoid awkward double-sharps or double-flats (e.g. preferring Fa♯ for ♭3 -> La,
 * and Sol♭ for 4 -> Do♭ or ♭7 -> Fa♭? Actually Fa♯ ♭7 is Mi, super clean!).
 */
export function chooseBestRootSpelling(pos, intervalSymbols = []) {
  const entry = CIRCLE_POSITIONS[mod(pos, 12)];
  const candidates = [entry.major];
  if (entry.altMajor) candidates.push(entry.altMajor);

  let best = candidates[0];
  let bestPenalty = Infinity;

  for (const cand of candidates) {
    let penalty = Math.abs(cand.acc) * 0.25;
    for (const sym of intervalSymbols) {
      const res = spellInterval(cand, sym);
      if (Math.abs(res.acc) >= 2) penalty += 10;
      else if (
        (res.letter === 2 && res.acc === 1) || // Mi♯ / E♯
        (res.letter === 6 && res.acc === 1) || // Si♯ / B♯
        (res.letter === 0 && res.acc === -1) || // Do♭ / C♭
        (res.letter === 3 && res.acc === -1)    // Fa♭ / F♭
      ) {
        penalty += 2;
      } else {
        penalty += Math.abs(res.acc) * 0.1;
      }
    }
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      best = cand;
    }
  }
  return best;
}

// Scales & Chords for Explorer & Bass Harmony drills
export const HARMONIC_LENSES = {
  major: {
    id: 'major',
    label: 'Major',
    subtitle: 'Ionian · 7 contiguous slices (−1 to +5)',
    degrees: ['1', '2', '3', '4', '5', '6', '7'],
    chordTones: ['1', '3', '5', '7']
  },
  minor: {
    id: 'minor',
    label: 'Minor',
    subtitle: 'Natural Minor · 7 contiguous slices (−4 to +2)',
    degrees: ['1', '2', '♭3', '4', '5', '♭6', '♭7'],
    chordTones: ['1', '♭3', '5', '♭7']
  },
  dorian: {
    id: 'dorian',
    label: 'Dorian',
    subtitle: 'Funk Minor · Mirror-symmetric (−3 to +3 around 1)',
    degrees: ['1', '2', '♭3', '4', '5', '6', '♭7'],
    chordTones: ['1', '♭3', '6', '♭7']
  },
  pentaMinor: {
    id: 'pentaMinor',
    label: 'Penta m',
    subtitle: 'Bass Pocket · 5 contiguous slices (−3 to +1)',
    degrees: ['1', '♭3', '4', '5', '♭7'],
    chordTones: ['1', '♭3', '5', '♭7']
  },
  maj7: {
    id: 'maj7',
    label: 'Maj7',
    subtitle: '1 · 3 · 5 · 7 Arpeggio',
    degrees: ['1', '3', '5', '7'],
    chordTones: ['1', '3', '5', '7']
  },
  dom7: {
    id: 'dom7',
    label: 'Dom7',
    subtitle: '1 · 3 · 5 · ♭7 Groove / V7',
    degrees: ['1', '3', '5', '♭7'],
    chordTones: ['1', '3', '5', '♭7']
  },
  m7: {
    id: 'm7',
    label: 'm7',
    subtitle: '1 · ♭3 · 5 · ♭7 Minor 7th',
    degrees: ['1', '♭3', '5', '♭7'],
    chordTones: ['1', '♭3', '5', '♭7']
  },
  m7b5: {
    id: 'm7b5',
    label: 'm7♭5',
    subtitle: '1 · ♭3 · ♭5 · ♭7 Half-Diminished',
    degrees: ['1', '♭3', '♭5', '♭7'],
    chordTones: ['1', '♭3', '♭5', '♭7']
  },
  iiVI: {
    id: 'iiVI',
    label: 'ii–V–I',
    subtitle: '2 → 5 → 1 Counter-Clockwise Walk',
    degrees: ['2', '5', '1'],
    chordTones: ['2', '5', '1']
  }
};

// Standard 4-string Bass Tuning (low to high: E1, A1, D2, G2)
export const BASS_STRINGS = [
  { index: 0, openMidi: 28, pc: 4, pos: 4, solfege: 'Mi', letter: 'E', gauge: 2.5 },
  { index: 1, openMidi: 33, pc: 9, pos: 3, solfege: 'La', letter: 'A', gauge: 2.0 },
  { index: 2, openMidi: 38, pc: 2, pos: 2, solfege: 'Ré', letter: 'D', gauge: 1.55 },
  { index: 3, openMidi: 43, pc: 7, pos: 1, solfege: 'Sol', letter: 'G', gauge: 1.2 }
];

export function getBassFretInfo(stringIndex, fret) {
  const str = BASS_STRINGS[stringIndex];
  const midi = str.openMidi + fret;
  const pc = mod(midi, 12);
  const pos = pitchClassToPos(pc);
  return {
    stringIndex,
    fret,
    midi,
    pc,
    pos,
    stringSolfege: str.solfege,
    stringLetter: str.letter
  };
}

/**
 * Formats step offset on the Circle in crisp human terms, e.g. "+4 CW", "−3 CCW", "opposite (6)".
 */
export function formatCircleStepDelta(offset) {
  const d = mod(offset, 12);
  if (d === 0) return 'same spot (0)';
  if (d === 6) return 'opposite across circle (6)';
  if (d <= 5) return d === 1 ? '+1 step CW' : `+${d} steps CW`;
  const ccw = 12 - d;
  return ccw === 1 ? '−1 step CCW' : `−${ccw} steps CCW`;
}
