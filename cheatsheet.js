// 5-page minimalist Circle of Fifths & Bassist Cheat Sheet

export function getTheoryPages(notation = 'solfege') {
  const isSol = notation !== 'letter';
  const n = (sol, letName) => (isSol ? sol : letName);

  return [
    {
      title: 'Circle Geometry',
      html: `
        <div class="g-card">
          <h3 class="g-heading">Clock Steps from Root <span class="g-sub">(1 = any position)</span></h3>
          <table class="g-table">
            <thead>
              <tr><th>Step</th><th>CW (+5ths)</th><th>CCW (+4ths)</th></tr>
            </thead>
            <tbody>
              <tr>
                <th>1 step</th>
                <td class="cell-accent"><b>5</b> · Perfect 5th</td>
                <td class="cell-accent"><b>4</b> · Perfect 4th</td>
              </tr>
              <tr>
                <th>2 steps</th>
                <td><b>2</b> · Major 2nd</td>
                <td class="cell-accent"><b>♭7</b> · Minor 7th</td>
              </tr>
              <tr>
                <th>3 steps</th>
                <td class="cell-accent"><b>6</b> · Rel. minor (vi)</td>
                <td class="cell-accent"><b>♭3</b> · Minor 3rd</td>
              </tr>
              <tr>
                <th>4 steps</th>
                <td class="cell-accent"><b>3</b> · Major 3rd</td>
                <td><b>♭6</b> · Minor 6th</td>
              </tr>
              <tr>
                <th>5 steps</th>
                <td><b>7</b> · Major 7th</td>
                <td><b>♭2</b> · Phrygian / SubV</td>
              </tr>
              <tr>
                <th>6 (opp.)</th>
                <td colspan="2" class="cell-accent"><b>♯4 / ♭5</b> · Tritone (straight across!)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="g-card g-compact-list">
          <h3 class="g-heading">Contiguous Scale Arcs</h3>
          <div><b>Major Scale (7 slices)</b> — From <b>4</b> (−1 CCW) through <b>1, 5, 2, 6, 3, 7</b> (+5 CW).</div>
          <div><b>Dorian Funk Mode (7 slices)</b> — Perfectly symmetric around <b>1</b>: <b>♭3, ♭7, 4, [1], 5, 2, 6</b> (−3 to +3!).</div>
          <div><b>Natural Minor (7 slices)</b> — Shifted 3 steps CCW: <b>♭6, ♭3, ♭7, 4, 1, 5, 2</b> (−4 to +2).</div>
          <div><b>Minor Pentatonic (5 slices)</b> — Tight 5-note pocket: <b>♭3, ♭7, 4, 1, 5</b>.</div>
        </div>
      `
    },
    {
      title: 'Chords & Degree Math',
      html: `
        <div class="g-card">
          <h3 class="g-heading">7th Chord Shapes on the Wheel</h3>
          <table class="g-table g-table-left">
            <thead>
              <tr><th>Chord</th><th>Degrees</th><th>Circle Offsets</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Maj7</b></td>
                <td>1 · 3 · 5 · 7</td>
                <td>0, +4, +1, +5 <span class="g-note">(all CW)</span></td>
              </tr>
              <tr>
                <td><b>Dom7</b></td>
                <td class="cell-accent">1 · 3 · 5 · ♭7</td>
                <td>0, +4, +1, −2 <span class="g-note">(3↔♭7 = opp.)</span></td>
              </tr>
              <tr>
                <td><b>m7</b></td>
                <td class="cell-accent">1 · ♭3 · 5 · ♭7</td>
                <td>0, −3, +1, −2 <span class="g-note">(warm cluster)</span></td>
              </tr>
              <tr>
                <td><b>m7♭5</b></td>
                <td>1 · ♭3 · ♭5 · ♭7</td>
                <td>0, −3, +6, −2</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="g-card">
          <h3 class="g-heading">Interval of a Degree <span class="g-sub">(Add Circle offsets!)</span></h3>
          <table class="g-table g-table-left">
            <thead>
              <tr><th>Target</th><th>Math on Circle</th><th>Result</th></tr>
            </thead>
            <tbody>
              <tr><td><b>3</b> of <b>IV</b> (4)</td><td>−1 + 4 = +3</td><td class="cell-accent"><b>6</b></td></tr>
              <tr><td><b>3</b> of <b>V</b> (5)</td><td>+1 + 4 = +5</td><td class="cell-accent"><b>7</b> (leading tone)</td></tr>
              <tr><td><b>♭7</b> of <b>V7</b> (5)</td><td>+1 − 2 = −1</td><td class="cell-accent"><b>4</b> (resolves → 3)</td></tr>
              <tr><td><b>♭3</b> of <b>ii</b> (2)</td><td>+2 − 3 = −1</td><td><b>4</b></td></tr>
              <tr><td><b>♭3</b> of <b>vi</b> (6)</td><td>+3 − 3 = 0</td><td><b>1</b> (tonic!)</td></tr>
              <tr><td><b>3</b> of <b>II7</b> (V/V)</td><td>+2 + 4 = +6</td><td><b>♯4</b> (tritone)</td></tr>
            </tbody>
          </table>
        </div>
      `
    },
    {
      title: 'Keys & Relatives',
      html: `
        <div class="g-card g-compact-list">
          <h3 class="g-heading">Relative Minor ↔ Major</h3>
          <div><b>Major → Relative Minor (vi)</b> — Jump <b>+3 steps clockwise</b> (90° right).<br/><span class="g-muted-line">${n('Do → La m · Mi♭ → Do m · La → Fa♯ m', 'C → Am · E♭ → Cm · A → F♯m')}</span></div>
          <div><b>Minor → Relative Major (I)</b> — Jump <b>−3 steps CCW</b> (90° left).<br/><span class="g-muted-line">${n('Fa m → La♭ · Ré m → Fa · Si m → Ré', 'Fm → A♭ · Dm → F · Bm → D')}</span></div>
        </div>

        <div class="g-card g-compact-list">
          <h3 class="g-heading">Order of Sharps &amp; Flats</h3>
          <div><b>Sharps (♯)</b> — Start at <b>${n('Fa', 'F')}</b> (11h) and read <b>clockwise</b>:</div>
          <div class="g-chips">
            <span><b>1♯</b> ${n('Fa♯', 'F♯')}</span>
            <span><b>2♯</b> ${n('Do♯', 'C♯')}</span>
            <span><b>3♯</b> ${n('Sol♯', 'G♯')}</span>
            <span><b>4♯</b> ${n('Ré♯', 'D♯')}</span>
            <span><b>5♯</b> ${n('La♯', 'A♯')}</span>
          </div>
          <div class="g-divider"></div>
          <div><b>Flats (♭)</b> — Start at <b>${n('Si♭', 'B♭')}</b> (10h) and read <b>CCW</b>:</div>
          <div class="g-chips">
            <span><b>1♭</b> ${n('Si♭', 'B♭')}</span>
            <span><b>2♭</b> ${n('Mi♭', 'E♭')}</span>
            <span><b>3♭</b> ${n('La♭', 'A♭')}</span>
            <span><b>4♭</b> ${n('Ré♭', 'D♭')}</span>
            <span><b>5♭</b> ${n('Sol♭', 'G♭')}</span>
          </div>
          <div class="g-divider"></div>
          <div class="g-muted-line"><b>Quick Key Trick</b> — <i>N</i> steps CW from ${n('Do', 'C')} = <i>N</i>♯ · <i>N</i> steps CCW from ${n('Do', 'C')} = <i>N</i>♭.</div>
        </div>
      `
    },
    {
      title: 'Bass Progressions',
      html: `
        <div class="g-card g-compact-list">
          <h3 class="g-heading">Essential Bass Walks on the Wheel</h3>
          <div><b>ii → V → I</b> — Walk <b>counter-clockwise</b> one notch at a time (+2 → +1 → 0).<br/><span class="g-muted-line">In ${n('Si♭', 'B♭')}: <b>${n('Do m7 → Fa7 → Si♭Maj7', 'Cm7 → F7 → B♭Maj7')}</b></span></div>
          <div><b>vi → ii → V → I</b> — Walk <b>3 notches CCW</b> straight home (+3 → +2 → +1 → 0).<br/><span class="g-muted-line">In ${n('Do', 'C')}: <b>${n('La m7 → Ré m7 → Sol7 → DoMaj7', 'Am7 → Dm7 → G7 → CMaj7')}</b></span></div>
          <div><b>I – IV – V Groove Box</b> — Root flanked by its two immediate neighbors (−1, 0, +1).<br/><span class="g-muted-line">In ${n('Sol', 'G')}: <b>${n('Do (IV) · Sol (I) · Ré (V)', 'C (IV) · G (I) · D (V)')}</b></span></div>
        </div>

        <div class="g-card g-compact-list">
          <h3 class="g-heading">Tritone Sub &amp; Guide Tones</h3>
          <div><b>Guide Tones of V7</b> — Its <b>3</b> and <b>♭7</b> sit <b>diametrically opposite</b> on the Circle (6 steps apart).</div>
          <div><b>Tritone Sub (♭II7 → I)</b> — Jump straight across the Circle from <b>V7</b> to <b>♭II7</b>: both chords share the <i>exact same</i> 3 &amp; ♭7 guide tones, giving you a butter-smooth chromatic bass slide down 1 fret into <b>I</b>!<br/><span class="g-muted-line">${n('Ré m7 → Ré♭7 → DoMaj7', 'Dm7 → D♭7 → CMaj7')}</span></div>
        </div>
      `
    },
    {
      title: 'Bass Neck ↔ Circle',
      html: `
        <div class="g-card g-compact-list">
          <h3 class="g-heading">4-String Tuning IS the Circle</h3>
          <div>Open strings <b>${n('Mi → La → Ré → Sol', 'E → A → D → G')}</b> sit at <b>4h → 3h → 2h → 1h</b> on the Circle!</div>
          <div>• <b>1 string higher (same fret)</b> = +4th = <b>1 step CCW</b> on Circle.</div>
          <div>• <b>1 string lower (same fret)</b> = +5th (down 4th) = <b>1 step CW</b>.</div>
          <div>• <b>Power 5th (+1 string, +2 frets)</b> = <b>+1 step CW</b>.</div>
          <div>• <b>Major 3rd (+1 string, −1 fret)</b> = <b>+4 steps CW</b>.</div>
          <div>• <b>Minor 3rd (+1 string, −2 frets)</b> = <b>−3 steps CCW</b>.</div>
          <div>• <b>Minor 7th (+2 strings, same fret)</b> = <b>−2 steps CCW</b>.</div>
        </div>

        <div class="g-card">
          <h3 class="g-heading">Solfège ↔ Anglo Notation</h3>
          <table class="g-table">
            <thead>
              <tr><th>Do</th><th>Ré</th><th>Mi</th><th>Fa</th><th>Sol</th><th>La</th><th>Si</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class="cell-accent"><b>C</b></td>
                <td class="cell-accent"><b>D</b></td>
                <td class="cell-accent"><b>E</b></td>
                <td class="cell-accent"><b>F</b></td>
                <td class="cell-accent"><b>G</b></td>
                <td class="cell-accent"><b>A</b></td>
                <td class="cell-accent"><b>B</b></td>
              </tr>
            </tbody>
          </table>
        </div>
      `
    }
  ];
}
