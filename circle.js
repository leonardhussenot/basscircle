// Interactive SVG Circle of Fifths, 4-String Bass Fretboard & Mastery Wheel components

import {
  BASS_STRINGS,
  CIRCLE_POSITIONS,
  INTERVALS,
  OFFSET_TO_DEGREE,
  mod,
  pitchClassToPos,
  formatSpelledNote,
  formatChord,
  chooseBestRootSpelling,
  spellInterval
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

export function posAngleRad(pos) {
  return -Math.PI / 2 + mod(pos, 12) * (Math.PI / 6);
}

export function polarPoint(cx, cy, r, angleRad) {
  return [cx + r * Math.cos(angleRad), cy + r * Math.sin(angleRad)];
}

function sectorPath(cx, cy, rInner, rOuter, startAngle, endAngle) {
  const [x1, y1] = polarPoint(cx, cy, rOuter, startAngle);
  const [x2, y2] = polarPoint(cx, cy, rOuter, endAngle);
  const [x3, y3] = polarPoint(cx, cy, rInner, endAngle);
  const [x4, y4] = polarPoint(cx, cy, rInner, startAngle);
  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 0 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    'Z'
  ].join(' ');
}

function curvedChordPath(cx, cy, rEndpoint, fromPos, toPos, pull = 0.56) {
  const a1 = posAngleRad(fromPos);
  const a2 = posAngleRad(toPos);
  const [x1, y1] = polarPoint(cx, cy, rEndpoint, a1);
  const [x2, y2] = polarPoint(cx, cy, rEndpoint, a2);

  const diff = mod(toPos - fromPos, 12);
  if (diff === 6) {
    // Opposite across circle: bow gently around the center hub so line is clearly visible
    const midAngle = a1 + Math.PI / 2;
    const [qx, qy] = polarPoint(cx, cy, 66, midAngle);
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${qx.toFixed(1)} ${qy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }

  const mx = (x1 + x2) * 0.5;
  const my = (y1 + y2) * 0.5;
  const qx = cx + (mx - cx) * pull;
  const qy = cy + (my - cy) * pull;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${qx.toFixed(1)} ${qy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

/**
 * Interactive SVG Circle of Fifths component (`viewBox="0 0 380 380"`).
 */
export class CircleView {
  constructor(container, { onTapPosition, onTapHub } = {}) {
    this.container = container;
    this.onTapPosition = onTapPosition || (() => {});
    this.onTapHub = onTapHub || (() => {});
    this.cx = 190;
    this.cy = 190;
    this.R = 138;
    this.nodeEls = [];
    this.wrongTimers = new Array(12).fill(null);
    this._buildStaticSkeleton();
  }

  _buildStaticSkeleton() {
    this.container.textContent = '';
    const svg = svgEl('svg', {
      viewBox: '0 0 380 380',
      class: 'circle-svg',
      role: 'group',
      'aria-label': 'Interactive Circle of Fifths'
    });

    const defs = svgEl('defs');
    const marker = svgEl('marker', {
      id: `arrow-${Math.random().toString(36).slice(2, 7)}`,
      viewBox: '0 0 10 10',
      refX: '7.5',
      refY: '5',
      markerWidth: '6',
      markerHeight: '6',
      orient: 'auto-start-reverse'
    });
    this.arrowId = marker.getAttribute('id');
    marker.appendChild(
      svgEl('path', {
        d: 'M 1.5 1.8 L 8.5 5 L 1.5 8.2 z',
        fill: '#1F4E37'
      })
    );
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Subtle inner harmonic canvas disc
    svg.appendChild(
      svgEl('circle', {
        cx: this.cx,
        cy: this.cy,
        r: 108,
        class: 'circle-inner-disc'
      })
    );

    // Main Circle of Fifths ring
    svg.appendChild(
      svgEl('circle', {
        cx: this.cx,
        cy: this.cy,
        r: this.R,
        class: 'circle-main-ring'
      })
    );

    // Subtle 12 clock ticks around outer perimeter (12 o'clock emphasized)
    const ticksGroup = svgEl('g', { class: 'circle-ticks', 'aria-hidden': 'true' });
    for (let pos = 0; pos < 12; pos++) {
      const ang = posAngleRad(pos);
      const r1 = pos === 0 ? 170 : 172;
      const r2 = pos === 0 ? 178 : 176.5;
      const [x1, y1] = polarPoint(this.cx, this.cy, r1, ang);
      const [x2, y2] = polarPoint(this.cx, this.cy, r2, ang);
      ticksGroup.appendChild(
        svgEl('line', {
          x1: x1.toFixed(1),
          y1: y1.toFixed(1),
          x2: x2.toFixed(1),
          y2: y2.toFixed(1),
          class: pos === 0 ? 'circle-tick circle-tick-top' : 'circle-tick'
        })
      );
    }
    svg.appendChild(ticksGroup);

    // Dynamic sector highlights (e.g. contiguous scale arc in Explorer)
    this.sectorGroup = svgEl('g', { class: 'circle-sectors', 'aria-hidden': 'true' });
    svg.appendChild(this.sectorGroup);

    // Dynamic harmonic geometry layer (arcs, polygons, bass walk lines)
    this.geometryGroup = svgEl('g', { class: 'circle-geometry', 'aria-hidden': 'true' });
    svg.appendChild(this.geometryGroup);

    // Center Hub (rendered above chord lines so lines pass cleanly behind it)
    this.hubGroup = svgEl('g', {
      class: 'circle-hub',
      role: 'button',
      tabindex: '0',
      'aria-label': 'Circle center prompt'
    });
    this.hubCircle = svgEl('circle', {
      cx: this.cx,
      cy: this.cy,
      r: 46,
      class: 'circle-hub-bg'
    });
    this.hubPrimary = svgEl('text', {
      x: this.cx,
      y: this.cy - 4,
      class: 'circle-hub-primary',
      'text-anchor': 'middle',
      'dominant-baseline': 'central'
    });
    this.hubSub = svgEl('text', {
      x: this.cx,
      y: this.cy + 16,
      class: 'circle-hub-sub',
      'text-anchor': 'middle',
      'dominant-baseline': 'central'
    });
    this.hubGroup.appendChild(this.hubCircle);
    this.hubGroup.appendChild(this.hubPrimary);
    this.hubGroup.appendChild(this.hubSub);
    this.hubGroup.addEventListener('click', () => this.onTapHub());
    svg.appendChild(this.hubGroup);

    // 12 Interactive Nodes + Radial Sector Hit Targets
    this.nodesGroup = svgEl('g', { class: 'circle-nodes' });
    this.nodeEls = [];
    const halfSlice = Math.PI / 12;

    for (let pos = 0; pos < 12; pos++) {
      const ang = posAngleRad(pos);
      const [nx, ny] = polarPoint(this.cx, this.cy, this.R, ang);
      const [bx, by] = polarPoint(this.cx, this.cy, 98, ang); // inner badge coordinate

      const g = svgEl('g', {
        class: 'c-node',
        'data-pos': pos,
        role: 'button',
        tabindex: '0',
        'aria-label': `Position ${pos}`
      });

      // Invisible generous radial wedge hit target (r = 68..182, +-15 deg)
      const hitSector = svgEl('path', {
        d: sectorPath(this.cx, this.cy, 68, 182, ang - halfSlice, ang + halfSlice),
        class: 'c-node-hit'
      });

      const circle = svgEl('circle', {
        cx: nx.toFixed(1),
        cy: ny.toFixed(1),
        r: 26.5,
        class: 'c-node-disc'
      });

      const blankDot = svgEl('circle', {
        cx: nx.toFixed(1),
        cy: ny.toFixed(1),
        r: 2.5,
        class: 'c-node-dot'
      });

      const primaryText = svgEl('text', {
        x: nx.toFixed(1),
        y: ny.toFixed(1),
        class: 'c-node-primary',
        'text-anchor': 'middle',
        'dominant-baseline': 'central'
      });

      const secondaryText = svgEl('text', {
        x: nx.toFixed(1),
        y: (ny + 9).toFixed(1),
        class: 'c-node-secondary',
        'text-anchor': 'middle',
        'dominant-baseline': 'central'
      });

      // Inner radial pill badge (for degree/chord role)
      const subBadgeBg = svgEl('rect', {
        x: (bx - 12).toFixed(1),
        y: (by - 8).toFixed(1),
        width: 24,
        height: 16,
        rx: 6,
        class: 'c-node-badge-bg is-gone'
      });
      const subBadgeText = svgEl('text', {
        x: bx.toFixed(1),
        y: by.toFixed(1),
        class: 'c-node-badge-text is-gone',
        'text-anchor': 'middle',
        'dominant-baseline': 'central'
      });

      g.appendChild(hitSector);
      g.appendChild(circle);
      g.appendChild(blankDot);
      g.appendChild(primaryText);
      g.appendChild(secondaryText);
      g.appendChild(subBadgeBg);
      g.appendChild(subBadgeText);

      g.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onTapPosition(pos);
      });
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.onTapPosition(pos);
        }
      });

      this.nodesGroup.appendChild(g);
      this.nodeEls.push({
        pos,
        nx,
        ny,
        bx,
        by,
        g,
        circle,
        blankDot,
        primaryText,
        secondaryText,
        subBadgeBg,
        subBadgeText
      });
    }

    svg.appendChild(this.nodesGroup);
    this.svg = svg;
    this.container.appendChild(svg);
  }

  clearWrongTimers() {
    for (let i = 0; i < 12; i++) {
      if (this.wrongTimers[i]) {
        clearTimeout(this.wrongTimers[i]);
        this.wrongTimers[i] = null;
      }
    }
  }

  /**
   * Updates all 12 nodes on the Circle.
   * Each node state: `{ mode: 'blank'|'labeled'|'anchor'|'source'|'placed'|'correct'|'scale'|'pulse', primary, secondary, subBadge }`
   */
  setNodes(nodesState) {
    this.clearWrongTimers();
    for (let pos = 0; pos < 12; pos++) {
      this.updateSingleNode(pos, nodesState[pos]);
    }
  }

  updateSingleNode(pos, st) {
    const item = this.nodeEls[pos];
    if (!item || !st) return;

    const mode = st.mode || 'labeled';
    item.g.setAttribute('class', `c-node mode-${mode}`);

    const primary = st.primary || '';
    const secondary = st.secondary || '';
    const hasSecondary = Boolean(secondary && mode !== 'blank');

    item.primaryText.textContent = mode === 'blank' ? '' : primary;
    item.secondaryText.textContent = hasSecondary ? secondary : '';

    if (hasSecondary) {
      item.primaryText.setAttribute('y', (item.ny - 5).toFixed(1));
      item.primaryText.classList.add('has-sec');
    } else {
      item.primaryText.setAttribute('y', item.ny.toFixed(1));
      item.primaryText.classList.remove('has-sec');
    }

    item.primaryText.classList.toggle('is-compact', primary.length >= 5 && primary.length < 7);
    item.primaryText.classList.toggle('is-xcompact', primary.length >= 7);

    const badge = st.subBadge || '';
    if (badge) {
      const w = Math.max(22, badge.length * 6.8 + 9);
      item.subBadgeBg.setAttribute('x', (item.bx - w / 2).toFixed(1));
      item.subBadgeBg.setAttribute('width', w.toFixed(1));
      item.subBadgeText.textContent = badge;
      item.subBadgeBg.classList.remove('is-gone');
      item.subBadgeText.classList.remove('is-gone');
    } else {
      item.subBadgeBg.classList.add('is-gone');
      item.subBadgeText.classList.add('is-gone');
    }

    item.g.setAttribute(
      'aria-label',
      mode === 'blank' ? `Circle slot ${pos + 1}` : `${primary}${badge ? ` (${badge})` : ''}`
    );
  }

  /**
   * Flashes a wrong tap on `pos`, temporarily revealing `flashLabel` on blank slots
   * so the user immediately learns what position they actually hit.
   */
  flashWrongNode(pos, restoreState, flashLabel = '') {
    const item = this.nodeEls[pos];
    if (!item) return;
    if (this.wrongTimers[pos]) clearTimeout(this.wrongTimers[pos]);

    item.g.classList.add('is-wrong');
    if (restoreState.mode === 'blank' && flashLabel) {
      item.primaryText.textContent = flashLabel;
      item.primaryText.setAttribute('y', item.ny.toFixed(1));
    }

    this.wrongTimers[pos] = setTimeout(() => {
      this.wrongTimers[pos] = null;
      this.updateSingleNode(pos, restoreState);
    }, 480);
  }

  pulseNode(pos) {
    const item = this.nodeEls[pos];
    if (!item) return;
    item.g.classList.remove('is-pulsing');
    void item.g.getBoundingClientRect();
    item.g.classList.add('is-pulsing');
  }

  setHub(primary, sub = '', { interactive = false, done = false } = {}) {
    const len = (primary || '').length;
    this.hubPrimary.textContent = primary || '';
    this.hubPrimary.classList.toggle('is-long', len > 5 && len < 9);
    this.hubPrimary.classList.toggle('is-xlong', len >= 9);
    this.hubSub.textContent = sub || '';
    this.hubPrimary.setAttribute('y', sub ? String(this.cy - 5) : String(this.cy));
    this.hubGroup.classList.toggle('is-interactive', interactive);
    this.hubGroup.classList.toggle('is-done', done);
  }

  setSectors(positions = []) {
    this.sectorGroup.textContent = '';
    if (!positions.length) return;
    const half = Math.PI / 12 - 0.018;
    for (const pos of positions) {
      const ang = posAngleRad(pos);
      this.sectorGroup.appendChild(
        svgEl('path', {
          d: sectorPath(this.cx, this.cy, 108, 166, ang - half, ang + half),
          class: 'circle-sector-wedge'
        })
      );
    }
  }

  clearGeometry() {
    this.geometryGroup.textContent = '';
  }

  /**
   * Renders geometric connections inside the Circle:
   * - `{ type: 'arc', fromPos, toPos }`
   * - `{ type: 'two-hop', fromPos, midPos, toPos }`
   * - `{ type: 'polygon', positions }`
   * - `{ type: 'walk', positions }`
   */
  renderGeometry(geo) {
    this.geometryGroup.textContent = '';
    if (!geo || geo.type === 'none') return;

    const rEnd = 109;

    if (geo.type === 'arc' && geo.fromPos !== geo.toPos) {
      this.geometryGroup.appendChild(
        svgEl('path', {
          d: curvedChordPath(this.cx, this.cy, rEnd, geo.fromPos, geo.toPos, 0.52),
          class: 'geo-arc',
          'marker-end': `url(#${this.arrowId})`
        })
      );
      return;
    }

    if (geo.type === 'two-hop') {
      if (geo.fromPos !== geo.midPos) {
        this.geometryGroup.appendChild(
          svgEl('path', {
            d: curvedChordPath(this.cx, this.cy, rEnd, geo.fromPos, geo.midPos, 0.58),
            class: 'geo-arc geo-arc-dashed'
          })
        );
      }
      if (geo.midPos !== geo.toPos) {
        this.geometryGroup.appendChild(
          svgEl('path', {
            d: curvedChordPath(this.cx, this.cy, rEnd, geo.midPos, geo.toPos, 0.5),
            class: 'geo-arc',
            'marker-end': `url(#${this.arrowId})`
          })
        );
      }
      return;
    }

    if (geo.type === 'polygon' && Array.isArray(geo.positions) && geo.positions.length >= 2) {
      // Sort unique positions clockwise around the Circle so the chord forms a clean non-crossing polygon
      const uniqueSorted = Array.from(new Set(geo.positions.map((p) => mod(p, 12)))).sort(
        (a, b) => a - b
      );
      if (uniqueSorted.length === 2) {
        this.geometryGroup.appendChild(
          svgEl('path', {
            d: curvedChordPath(this.cx, this.cy, rEnd, uniqueSorted[0], uniqueSorted[1], 0.55),
            class: 'geo-arc'
          })
        );
        return;
      }
      const pts = uniqueSorted.map((p) => {
        const [x, y] = polarPoint(this.cx, this.cy, 108, posAngleRad(p));
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      this.geometryGroup.appendChild(
        svgEl('polygon', {
          points: pts.join(' '),
          class: 'geo-polygon'
        })
      );
      return;
    }

    if (geo.type === 'walk' && Array.isArray(geo.positions) && geo.positions.length >= 2) {
      for (let i = 0; i < geo.positions.length - 1; i++) {
        const a = geo.positions[i];
        const b = geo.positions[i + 1];
        if (a === b) continue;
        const isLast = i === geo.positions.length - 2;
        this.geometryGroup.appendChild(
          svgEl('path', {
            d: curvedChordPath(this.cx, this.cy, rEnd, a, b, 0.62),
            class: isLast ? 'geo-arc' : 'geo-arc geo-arc-step',
            'marker-end': isLast ? `url(#${this.arrowId})` : null
          })
        );
      }
    }
  }
}

/**
 * Renders a crisp 4-string Bass Fretboard SVG (`Mi – La – Ré – Sol` / `E – A – D – G`, frets 0..12).
 * Supports 3 modes:
 * 1. `singleDot`: `{ stringIndex, fret, revealedLabel? }` (Forward Neck -> Circle quiz)
 * 2. `interactiveQuiz`: `{ foundFrets, wrongCell }` (Reverse Circle -> All 4 Strings quiz)
 * 3. `activeMap`: `Map<pc, { text, role }>` (Interactive Explorer)
 */
export function renderBassFretboard(
  container,
  {
    notation = 'solfege',
    singleDot = null,
    twoDots = null, // { root: { stringIndex, fret }, target: { stringIndex, fret, revealedLabel? } }
    interactiveQuiz = null,
    activeMap = null,
    onTapFret = null
  } = {}
) {
  container.textContent = '';

  const isTall = Boolean(interactiveQuiz);
  const width = 356;
  const height = isTall ? 120 : 100;
  const nutX = 46;
  const endX = 348;
  const fretCount = 12;
  const fretSpan = (endX - nutX) / fretCount;
  const rowY = isTall ? [94, 69, 44, 19] : [78, 57, 36, 15]; // 0 = E/Mi (bottom), 3 = G/Sol (top)
  const boardTop = isTall ? 9 : 8;
  const boardBottom = isTall ? 104 : 85;
  const fretNumY = isTall ? 115 : 95;

  const svg = svgEl('svg', {
    viewBox: `0 0 ${width} ${height}`,
    class: 'fretboard-svg',
    role: 'group',
    'aria-label': '4-string bass fretboard'
  });

  // Warm neck board background
  svg.appendChild(
    svgEl('rect', {
      x: nutX,
      y: boardTop,
      width: endX - nutX,
      height: boardBottom - boardTop,
      rx: 6,
      class: 'fb-board'
    })
  );

  // Classic inlay dots at frets 3, 5, 7, 9 and double dot at 12
  const midBoardY = (rowY[1] + rowY[2]) * 0.5;
  for (const f of [3, 5, 7, 9]) {
    const cx = nutX + (f - 0.5) * fretSpan;
    svg.appendChild(
      svgEl('circle', {
        cx: cx.toFixed(1),
        cy: midBoardY.toFixed(1),
        r: '3.1',
        class: 'fb-inlay'
      })
    );
  }
  const f12x = nutX + 11.5 * fretSpan;
  for (const cy of [(rowY[2] + rowY[3]) * 0.5, (rowY[0] + rowY[1]) * 0.5]) {
    svg.appendChild(
      svgEl('circle', {
        cx: f12x.toFixed(1),
        cy: cy.toFixed(1),
        r: '2.9',
        class: 'fb-inlay'
      })
    );
  }

  // Fret wires (1..12) + Nut (0)
  for (let f = 1; f <= fretCount; f++) {
    const x = nutX + f * fretSpan;
    svg.appendChild(
      svgEl('line', {
        x1: x.toFixed(1),
        y1: String(boardTop),
        x2: x.toFixed(1),
        y2: String(boardBottom),
        class: 'fb-fret'
      })
    );
  }
  svg.appendChild(
    svgEl('line', {
      x1: String(nutX),
      y1: String(boardTop - 0.5),
      x2: String(nutX),
      y2: String(boardBottom + 0.5),
      class: 'fb-nut'
    })
  );

  // Fret number markers along bottom
  const numberedFrets = new Set(isTall ? [1, 3, 5, 7, 9, 12] : [3, 5, 7, 9, 12]);
  if (singleDot && singleDot.fret > 0) numberedFrets.add(singleDot.fret);
  if (twoDots) {
    if (twoDots.root.fret > 0) numberedFrets.add(twoDots.root.fret);
    if (twoDots.target.fret > 0) numberedFrets.add(twoDots.target.fret);
  }
  for (const f of numberedFrets) {
    const x = nutX + (f - 0.5) * fretSpan;
    const isTargetFret = singleDot && singleDot.fret === f;
    svg.appendChild(
      Object.assign(
        svgEl('text', {
          x: x.toFixed(1),
          y: String(fretNumY),
          class: isTargetFret ? 'fb-fret-num is-target' : 'fb-fret-num',
          'text-anchor': 'middle'
        }),
        { textContent: String(f) }
      )
    );
  }

  // 4 Bass Strings + String Labels at left
  for (const str of BASS_STRINGS) {
    const y = rowY[str.index];
    const label = notation === 'letter' ? str.letter : str.solfege;

    const lblEl = svgEl('text', {
      x: isTall ? '14' : '16',
      y: String(y),
      class: 'fb-str-label',
      'text-anchor': 'middle',
      'dominant-baseline': 'central'
    });
    lblEl.textContent = label;
    svg.appendChild(lblEl);

    if (isTall) {
      // Subtle open-string ring at fret 0 so user sees open strings are tappable!
      svg.appendChild(
        svgEl('circle', {
          cx: String(nutX - 12),
          cy: String(y),
          r: '5.5',
          class: 'fb-open-slot'
        })
      );
    }

    svg.appendChild(
      svgEl('line', {
        x1: String(nutX),
        y1: String(y),
        x2: String(endX),
        y2: String(y),
        'stroke-width': String(str.gauge),
        class: 'fb-string'
      })
    );
  }

  // Mode 1: Single Quiz Dot (Neck -> Circle)
  if (singleDot) {
    const y = rowY[singleDot.stringIndex];
    const x =
      singleDot.fret === 0
        ? nutX - 11
        : nutX + (singleDot.fret - 0.5) * fretSpan;

    svg.appendChild(
      svgEl('circle', {
        cx: x.toFixed(1),
        cy: String(y),
        r: '10.5',
        class: 'fb-dot-halo'
      })
    );
    svg.appendChild(
      svgEl('circle', {
        cx: x.toFixed(1),
        cy: String(y),
        r: '7.6',
        class: singleDot.revealedLabel ? 'fb-dot-found' : 'fb-dot-quiz'
      })
    );
    const qMark = svgEl('text', {
      x: x.toFixed(1),
      y: String(y),
      class: 'fb-dot-text',
      'text-anchor': 'middle',
      'dominant-baseline': 'central'
    });
    qMark.textContent = singleDot.revealedLabel || '?';
    svg.appendChild(qMark);
  }

  // Mode 1b: Two-Dot Interval Shape on Neck (Root '1' + Target '?' -> Tap Degree on Circle!)
  if (twoDots) {
    const rY = rowY[twoDots.root.stringIndex];
    const rX =
      twoDots.root.fret === 0
        ? nutX - 11
        : nutX + (twoDots.root.fret - 0.5) * fretSpan;
    const tY = rowY[twoDots.target.stringIndex];
    const tX =
      twoDots.target.fret === 0
        ? nutX - 11
        : nutX + (twoDots.target.fret - 0.5) * fretSpan;

    // Subtle connecting line between Root '1' and '?'
    svg.appendChild(
      svgEl('line', {
        x1: rX.toFixed(1),
        y1: String(rY),
        x2: tX.toFixed(1),
        y2: String(tY),
        stroke: '#1C1B19',
        'stroke-width': '1.6',
        'stroke-dasharray': '3 3',
        opacity: '0.45'
      })
    );

    // Root '1' badge (warm sand fill + ink border)
    svg.appendChild(
      svgEl('circle', {
        cx: rX.toFixed(1),
        cy: String(rY),
        r: '7.6',
        fill: '#F2E9D9',
        stroke: '#1C1B19',
        'stroke-width': '1.7'
      })
    );
    svg.appendChild(
      Object.assign(
        svgEl('text', {
          x: rX.toFixed(1),
          y: String(rY),
          class: 'fb-note-label',
          'text-anchor': 'middle',
          'dominant-baseline': 'central'
        }),
        { textContent: '1' }
      )
    );

    // Target '?' dot
    svg.appendChild(
      svgEl('circle', {
        cx: tX.toFixed(1),
        cy: String(tY),
        r: '10.2',
        class: 'fb-dot-halo'
      })
    );
    svg.appendChild(
      svgEl('circle', {
        cx: tX.toFixed(1),
        cy: String(tY),
        r: '7.6',
        class: twoDots.target.revealedLabel ? 'fb-dot-found' : 'fb-dot-quiz'
      })
    );
    svg.appendChild(
      Object.assign(
        svgEl('text', {
          x: tX.toFixed(1),
          y: String(tY),
          class: 'fb-dot-text',
          'text-anchor': 'middle',
          'dominant-baseline': 'central'
        }),
        { textContent: twoDots.target.revealedLabel || '?' }
      )
    );
  }

  // Mode 2: Interactive Reverse Quiz (Circle -> Tap all 4 Bass Strings!)
  if (interactiveQuiz && onTapFret) {
    const foundByKey = new Map(
      (interactiveQuiz.foundFrets || []).map((it) => [`${it.stringIndex}:${it.fret}`, it])
    );
    const wrong = interactiveQuiz.wrongCell;

    for (const str of BASS_STRINGS) {
      const y = rowY[str.index];
      for (let f = 0; f <= fretCount; f++) {
        const midi = str.openMidi + f;
        const pc = mod(midi, 12);
        const cx = f === 0 ? nutX - 12 : nutX + (f - 0.5) * fretSpan;
        const hitX = f === 0 ? 2 : nutX + (f - 1) * fretSpan;
        const hitW = f === 0 ? nutX - 3 : fretSpan;
        const key = `${str.index}:${f}`;
        const found = foundByKey.get(key);
        const isWrong = wrong && wrong.stringIndex === str.index && wrong.fret === f;

        if (found) {
          svg.appendChild(
            svgEl('circle', {
              cx: cx.toFixed(1),
              cy: String(y),
              r: '8.4',
              class: 'fb-dot-found'
            })
          );
          const t = svgEl('text', {
            x: cx.toFixed(1),
            y: String(y),
            class: 'fb-dot-text',
            'text-anchor': 'middle',
            'dominant-baseline': 'central'
          });
          t.textContent = found.label;
          svg.appendChild(t);
        } else if (isWrong) {
          svg.appendChild(
            svgEl('circle', {
              cx: cx.toFixed(1),
              cy: String(y),
              r: '8.4',
              class: 'fb-dot-wrong'
            })
          );
          const t = svgEl('text', {
            x: cx.toFixed(1),
            y: String(y),
            class: 'fb-dot-wrong-text',
            'text-anchor': 'middle',
            'dominant-baseline': 'central'
          });
          t.textContent = wrong.label || '×';
          svg.appendChild(t);
        }

        // Generous rectangular touch cell covering the string & fret
        const hitRect = svgEl('rect', {
          x: hitX.toFixed(1),
          y: (y - 12.5).toFixed(1),
          width: hitW.toFixed(1),
          height: '25',
          fill: 'transparent',
          class: 'fb-hit-cell',
          role: 'button',
          'aria-label': `${str.solfege} string fret ${f}`
        });
        hitRect.addEventListener('click', (e) => {
          e.stopPropagation();
          onTapFret({
            stringIndex: str.index,
            fret: f,
            midi,
            pc,
            pos: pitchClassToPos(pc)
          });
        });
        svg.appendChild(hitRect);
      }
    }
  }

  // Mode 3: Interactive Explorer Dots across frets 0..12
  if (activeMap) {
    for (const str of BASS_STRINGS) {
      const y = rowY[str.index];
      for (let f = 0; f <= fretCount; f++) {
        const midi = str.openMidi + f;
        const pc = mod(midi, 12);
        const match = activeMap.get(pc);
        const x = f === 0 ? nutX - 10 : nutX + (f - 0.5) * fretSpan;

        if (match) {
          const g = svgEl('g', {
            class: `fb-note role-${match.role}`,
            role: onTapFret ? 'button' : null
          });
          g.appendChild(
            svgEl('circle', {
              cx: x.toFixed(1),
              cy: String(y),
              r: f === 0 ? '6.8' : '7.8',
              class: 'fb-note-disc'
            })
          );
          const txt = svgEl('text', {
            x: x.toFixed(1),
            y: String(y),
            class: 'fb-note-label',
            'text-anchor': 'middle',
            'dominant-baseline': 'central'
          });
          txt.textContent = match.text;
          g.appendChild(txt);

          if (onTapFret) {
            g.addEventListener('click', () =>
              onTapFret({
                stringIndex: str.index,
                fret: f,
                midi,
                pc,
                pos: pitchClassToPos(pc)
              })
            );
          }
          svg.appendChild(g);
        } else if (onTapFret && f > 0) {
          const hit = svgEl('circle', {
            cx: x.toFixed(1),
            cy: String(y),
            r: '7',
            fill: 'transparent',
            style: 'cursor:pointer'
          });
          hit.addEventListener('click', () =>
            onTapFret({
              stringIndex: str.index,
              fret: f,
              midi,
              pc,
              pos: pitchClassToPos(pc)
            })
          );
          svg.appendChild(hit);
        }
      }
    }
  }

  container.appendChild(svg);
}

/**
 * Renders the Mini 12-Sector Circle Mastery Emblem (`viewBox="0 0 84 84"`)
 * for the Home Screen progress card.
 */
export function renderMiniMasteryWheel(svgElement, sectorScores) {
  svgElement.textContent = '';
  const cx = 42;
  const cy = 42;
  const half = Math.PI / 12 - 0.045;

  // Top 12h tick
  svgElement.appendChild(
    svgEl('line', {
      x1: '42',
      y1: '2',
      x2: '42',
      y2: '5.5',
      stroke: '#1C1B19',
      'stroke-width': '1.6',
      'stroke-linecap': 'round'
    })
  );

  for (let pos = 0; pos < 12; pos++) {
    const score = Math.max(0, Math.min(1, sectorScores[pos] ?? 0));
    const ang = posAngleRad(pos);
    // Interpolate warm stone (#E6E1D6) -> deep ink (#1C1B19)
    const rCol = Math.round(230 - score * (230 - 28));
    const gCol = Math.round(225 - score * (225 - 27));
    const bCol = Math.round(214 - score * (214 - 25));

    svgElement.appendChild(
      svgEl('path', {
        d: sectorPath(cx, cy, 17, 36, ang - half, ang + half),
        fill: `rgb(${rCol}, ${gCol}, ${bCol})`
      })
    );
  }

  svgElement.appendChild(
    svgEl('circle', {
      cx: '42',
      cy: '42',
      r: '4.2',
      fill: '#1C1B19',
      opacity: '0.18'
    })
  );
}

/**
 * Helper for Interactive Explorer view: computes the 12 Circle node states,
 * sector highlights, chord geometry, and Fretboard activeMap for any `rootPos` & `lens`.
 */
export function buildExplorerModel(rootPos, lens, notation = 'solfege', neckLabelMode = 'degree') {
  const rootSpelled = chooseBestRootSpelling(rootPos, lens.degrees);
  const rootName = formatSpelledNote(rootSpelled, notation);

  const degSet = new Set(lens.degrees);
  const chordSet = new Set(lens.chordTones);

  // Map circle position -> spelled info within this lens
  const spelledByPos = new Map();
  for (const sym of lens.degrees) {
    const sp = spellInterval(rootSpelled, sym);
    spelledByPos.set(sp.pos, { spelled: sp, sym });
  }

  const nodes = Array.from({ length: 12 }, (_, pos) => {
    const offset = mod(pos - rootPos, 12);
    const defaultDeg = OFFSET_TO_DEGREE[offset];
    const inLens = spelledByPos.get(pos);
    const sym = inLens ? inLens.sym : defaultDeg;

    let notePrimary = '';
    let noteSecondary = '';
    if (inLens) {
      notePrimary = formatSpelledNote(inLens.spelled, notation);
    } else {
      const entry = CIRCLE_POSITIONS[pos];
      notePrimary = formatSpelledNote(entry.major, notation);
      if (pos === 6 && entry.altMajor) {
        noteSecondary = formatSpelledNote(entry.altMajor, notation);
      }
    }

    let mode = 'labeled';
    if (pos === rootPos) mode = 'anchor';
    else if (chordSet.has(sym)) mode = 'placed';
    else if (degSet.has(sym)) mode = 'source';

    return {
      pos,
      mode,
      primary: notePrimary,
      secondary: noteSecondary,
      subBadge: sym
    };
  });

  const activePositions = lens.degrees.map((sym) =>
    mod(rootPos + INTERVALS[sym].circleOffset, 12)
  );
  const chordPositions = lens.chordTones.map((sym) =>
    mod(rootPos + INTERVALS[sym].circleOffset, 12)
  );

  const geometry =
    lens.id === 'iiVI'
      ? { type: 'walk', positions: chordPositions }
      : { type: 'polygon', positions: chordPositions };

  // Build fretboard activeMap keyed by pitch class (0..11)
  const activeMap = new Map();
  for (const sym of lens.degrees) {
    const sp = spellInterval(rootSpelled, sym);
    const noteText = formatSpelledNote(sp, notation);
    const role = sym === '1' ? 'root' : chordSet.has(sym) ? 'chord' : 'scale';
    activeMap.set(sp.pc, {
      text: neckLabelMode === 'note' ? noteText : sym,
      role
    });
  }

  // Relative minor info for header
  const relMinSpelled = spellInterval(rootSpelled, '6');
  const relMinName = formatChord(relMinSpelled, 'm', notation);
  const sig = CIRCLE_POSITIONS[rootPos].keySig;
  const sigLabel = sig.count === 0 ? '0♯/♭' : `${sig.count}${sig.sign}`;

  return {
    rootName,
    relMinName,
    sigLabel,
    nodes,
    sectorPositions: activePositions,
    geometry,
    activeMap
  };
}
