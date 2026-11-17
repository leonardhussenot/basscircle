// Publication-grade SVG Bass Clef ("Clé de Fa" 𝄢) Staff Renderer for 4-String Bass

import {
  LETTERS_SOLFEGE,
  LETTERS_ANGLO,
  NATURAL_SEMITONES,
  mod,
  pitchClassToPos,
  formatAccidental
} from './theory.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) {
      el.setAttribute(k, String(v));
    }
  }
  return el;
}

/**
 * Converts a Bass Clef diatonic `step` (where 0 = bottom line Sol2/G2, 6 = 4th line Fa3/F3)
 * and `acc` (-1 = ♭, 0 = natural, +1 = ♯) into exact musical note + sounding bass MIDI.
 *
 * Electric bass sounds 1 octave lower than written (8vb):
 * - step -2 (1st ledger below) = open Mi / E1 (sounding MIDI 28)
 * - step  1 (1st space)        = open La / A1 (sounding MIDI 33)
 * - step  4 (3rd line, middle) = open Ré / D2 (sounding MIDI 38)
 * - step  6 (4th line, 𝄢 dots) = Fa / F2      (sounding MIDI 41)
 * - step  7 (4th space)        = open Sol/ G2 (sounding MIDI 43)
 * - step 10 (1st ledger above) = Do4 / Middle C written (sounding MIDI 48)
 */
export function bassStaffStepToNote(step, acc = 0) {
  // At step = 0: written G2 -> octaveIndexFromC = 2*7 + 4 = 18 (where C0 = 0)
  // Sounding on bass (8vb) = 1 octave lower -> C1 = MIDI 24, G1 = MIDI 31
  const diatonicFromC1 = 4 + step; // step -4 would be Do1 (MIDI 24); step -2 is Mi1 (MIDI 28)
  const octaveOffset = Math.floor(diatonicFromC1 / 7);
  const letter = mod(diatonicFromC1, 7);
  const soundingMidi = 24 + octaveOffset * 12 + NATURAL_SEMITONES[letter] + acc;
  const pc = mod(soundingMidi, 12);
  const pos = pitchClassToPos(pc);

  return {
    step,
    letter,
    acc,
    pc,
    pos,
    midi: soundingMidi,
    solfege: `${LETTERS_SOLFEGE[letter]}${formatAccidental(acc)}`,
    letterName: `${LETTERS_ANGLO[letter]}${formatAccidental(acc)}`
  };
}

// Standard Bass Clef Key Signature step positions:
// Sharps: Fa(6), Do(3), Sol(7), Ré(4), La(1), Mi(5)
const BASS_SHARP_STEPS = [6, 3, 7, 4, 1, 5];
// Flats: Si(2), Mi(5), La(1), Ré(4), Sol(0), Do(3)
const BASS_FLAT_STEPS = [2, 5, 1, 4, 0, 3];

function drawSharpGlyph(parent, x, y, scale = 1, className = 'st-acc') {
  const g = svgEl('g', {
    transform: `translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${scale})`,
    class: className
  });
  // Two vertical bars + two slanted crossbars
  g.appendChild(svgEl('line', { x1: -2.3, y1: -8.5, x2: -2.3, y2: 9, 'stroke-width': 1.35 }));
  g.appendChild(svgEl('line', { x1: 2.3, y1: -9, x2: 2.3, y2: 8.5, 'stroke-width': 1.35 }));
  g.appendChild(svgEl('line', { x1: -5.2, y1: -2.2, x2: 5.2, y2: -4.2, 'stroke-width': 2.2 }));
  g.appendChild(svgEl('line', { x1: -5.2, y1: 4.2, x2: 5.2, y2: 2.2, 'stroke-width': 2.2 }));
  parent.appendChild(g);
}

function drawFlatGlyph(parent, x, y, scale = 1, className = 'st-acc') {
  const g = svgEl('g', {
    transform: `translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${scale})`,
    class: className
  });
  // Stem + rounded belly centered precisely on (0, 0)
  g.appendChild(
    svgEl('line', {
      x1: -3.2,
      y1: -11.5,
      x2: -3.2,
      y2: 4.5,
      'stroke-width': 1.45,
      'stroke-linecap': 'round'
    })
  );
  g.appendChild(
    svgEl('path', {
      d: 'M -3.2 -2.2 C 3.8 -5.2, 5.2 1.8, -3.2 4.6',
      fill: 'none',
      'stroke-width': 1.85,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    })
  );
  parent.appendChild(g);
}

function drawBassClefGlyph(parent, xOrigin, yLine4) {
  // Engraved Bezier F-clef (Clé de Fa):
  // Bulb anchored on Line 4 (Fa, yLine4), arching to Line 5 (yLine4 - 10), sweeping down to Line 1 (yLine4 + 30)
  const g = svgEl('g', { class: 'st-clef' });

  // Origin bulb on Fa line (4th line)
  g.appendChild(
    svgEl('circle', {
      cx: xOrigin,
      cy: yLine4,
      r: 3.7,
      class: 'st-clef-fill'
    })
  );

  // Main curved body of the F-clef
  const d = [
    `M ${xOrigin - 2.8} ${yLine4}`,
    `C ${xOrigin - 3.5} ${yLine4 - 8.5}, ${xOrigin + 4} ${yLine4 - 11}, ${xOrigin + 10.5} ${yLine4 - 9.5}`,
    `C ${xOrigin + 18.5} ${yLine4 - 7.5}, ${xOrigin + 19.5} ${yLine4 + 4}, ${xOrigin + 13} ${yLine4 + 14.5}`,
    `C ${xOrigin + 8} ${yLine4 + 22.5}, ${xOrigin + 0.5} ${yLine4 + 27.5}, ${xOrigin - 6} ${yLine4 + 30.5}`
  ].join(' ');

  g.appendChild(
    svgEl('path', {
      d,
      class: 'st-clef-stroke'
    })
  );

  // Two signature dots framing Line 4 (Fa) in Space 4 (-5) and Space 3 (+5)
  g.appendChild(
    svgEl('circle', {
      cx: xOrigin + 22.5,
      cy: yLine4 - 4.8,
      r: 2.05,
      class: 'st-clef-fill'
    })
  );
  g.appendChild(
    svgEl('circle', {
      cx: xOrigin + 22.5,
      cy: yLine4 + 4.8,
      r: 2.05,
      class: 'st-clef-fill'
    })
  );

  parent.appendChild(g);
}

/**
 * Renders an engraved Clé de Fa (Bass Clef) staff SVG inside `container`.
 *
 * Options:
 * - `notes`: Array of `{ step, acc, showAccidental, state: 'default' | 'active' | 'done' }`
 * - `keySig`: `{ count: 0..5, sign: '♯' | '♭' | '' }`
 * - `highlightFaLine`: boolean (subtly tints Line 4 Fa for landmark intro cards)
 */
export function renderBassStaff(
  container,
  {
    notes = [],
    keySig = { count: 0, sign: '' },
    highlightFaLine = false
  } = {}
) {
  container.textContent = '';

  const width = 356;
  const height = 104;
  const staffLeft = 16;
  const staffRight = 340;
  const yLine1 = 74; // step 0 (Sol2 / G2)
  const stepY = (st) => yLine1 - st * 5;

  const svg = svgEl('svg', {
    viewBox: `0 0 ${width} ${height}`,
    class: 'staff-svg',
    role: 'img',
    'aria-label': 'Bass clef music staff (Clé de Fa)'
  });

  // Warm sheet-music card backdrop
  svg.appendChild(
    svgEl('rect', {
      x: 6,
      y: 4,
      width: width - 12,
      height: height - 8,
      rx: 10,
      class: 'st-paper'
    })
  );

  // 5 Staff Lines (steps 0, 2, 4, 6, 8)
  for (const st of [0, 2, 4, 6, 8]) {
    const y = stepY(st);
    const isFa = st === 6 && highlightFaLine;
    svg.appendChild(
      svgEl('line', {
        x1: staffLeft,
        y1: y,
        x2: staffRight,
        y2: y,
        class: isFa ? 'st-line st-line-fa' : 'st-line'
      })
    );
  }

  // Left & right barlines
  svg.appendChild(
    svgEl('line', {
      x1: staffLeft,
      y1: stepY(8),
      x2: staffLeft,
      y2: stepY(0),
      class: 'st-barline'
    })
  );
  svg.appendChild(
    svgEl('line', {
      x1: staffRight,
      y1: stepY(8),
      x2: staffRight,
      y2: stepY(0),
      class: 'st-barline'
    })
  );

  // Engraved Bass Clef (Clé de Fa) anchored on Line 4 (step 6, y = 44)
  drawBassClefGlyph(svg, 33, stepY(6));

  // Key Signature after the clef
  let noteAreaStart = 76;
  if (keySig && keySig.count > 0) {
    const stepsArr = keySig.sign === '♯' ? BASS_SHARP_STEPS : BASS_FLAT_STEPS;
    const count = Math.min(keySig.count, stepsArr.length);
    for (let i = 0; i < count; i++) {
      const x = 68 + i * 11.5;
      const y = stepY(stepsArr[i]);
      if (keySig.sign === '♯') {
        drawSharpGlyph(svg, x, y, 0.86, 'st-acc st-keysig');
      } else {
        drawFlatGlyph(svg, x, y, 0.88, 'st-acc st-keysig');
      }
    }
    noteAreaStart = 74 + count * 11.5 + 14;
  }

  // Render Note(s) + Ledger Lines + Inline Accidentals + Stems
  if (notes.length > 0) {
    const usableWidth = staffRight - noteAreaStart - 22;
    notes.forEach((n, idx) => {
      const x =
        notes.length === 1
          ? Math.max(noteAreaStart + 36, 192)
          : noteAreaStart + ((idx + 0.5) / notes.length) * usableWidth;
      const y = stepY(n.step);
      const state = n.state || 'default';

      // Ledger lines below staff (step <= -2)
      if (n.step <= -2) {
        for (let ls = -2; ls >= n.step; ls -= 2) {
          const ly = stepY(ls);
          svg.appendChild(
            svgEl('line', {
              x1: (x - 11.5).toFixed(1),
              y1: ly,
              x2: (x + 11.5).toFixed(1),
              y2: ly,
              class: 'st-ledger'
            })
          );
        }
      }

      // Ledger lines above staff (step >= 10, where 10 = Do4 / Middle C)
      if (n.step >= 10) {
        for (let ls = 10; ls <= n.step; ls += 2) {
          const ly = stepY(ls);
          svg.appendChild(
            svgEl('line', {
              x1: (x - 11.5).toFixed(1),
              y1: ly,
              x2: (x + 11.5).toFixed(1),
              y2: ly,
              class: 'st-ledger'
            })
          );
        }
      }

      // Inline accidental (if shown directly before the notehead)
      if (n.showAccidental && n.acc !== 0) {
        const accCls = `st-acc st-acc-${state}`;
        if (n.acc > 0) {
          drawSharpGlyph(svg, x - 15.5, y, 0.92, accCls);
        } else {
          drawFlatGlyph(svg, x - 14.5, y, 0.94, accCls);
        }
      }

      const noteGroup = svgEl('g', { class: `st-note is-${state}` });

      // Stem: up on right if step < 4, down on left if step >= 4
      if (n.step < 4) {
        noteGroup.appendChild(
          svgEl('line', {
            x1: (x + 5.6).toFixed(1),
            y1: (y - 1).toFixed(1),
            x2: (x + 5.6).toFixed(1),
            y2: (y - 31).toFixed(1),
            class: 'st-stem'
          })
        );
      } else {
        noteGroup.appendChild(
          svgEl('line', {
            x1: (x - 5.6).toFixed(1),
            y1: (y + 1).toFixed(1),
            x2: (x - 5.6).toFixed(1),
            y2: (y + 31).toFixed(1),
            class: 'st-stem'
          })
        );
      }

      // Tilted engraved quarter-note head
      noteGroup.appendChild(
        svgEl('ellipse', {
          cx: '0',
          cy: '0',
          rx: '6.3',
          ry: '4.4',
          transform: `translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(-19)`,
          class: 'st-head'
        })
      );

      svg.appendChild(noteGroup);
    });
  }

  container.appendChild(svg);
}
