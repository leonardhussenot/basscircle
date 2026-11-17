// 6-page minimalist Circle of Fifths, Clé de Fa & Bassist Cheat Sheet

export function getTheoryPages(notation = 'solfege') {
  const isSol = notation !== 'letter';
  const n = (sol, letName) => (isSol ? sol : letName);

  return [
    {
      title: 'Clé de Fa (𝄢) Guide',
      html: `
        <div class="g-card g-compact-list">
          <h3 class="g-heading">Landmarks <span class="g-sub">(From Clé d’Ut to Clé de Fa)</span></h3>
          <div><b>1st Ledger Above = ${n('Do', 'C')}4 (Middle C)</b> — Your exact <i>Clé d’Ut</i> reference C sits right on the 1st ledger line above the Clé de Fa staff!</div>
          <div><b>4th Line = ${n('Fa', 'F')}</b> — Framed between the two <b>𝄢</b> dots (${n('Ré', 'D')} string, fret 3).</div>
          <div><b>Middle Line (3rd) = ${n('Ré', 'D')}</b> — Open <b>${n('Ré', 'D')}</b> string!</div>
        </div>

        <div class="g-card">
          <h3 class="g-heading">4 Open Bass Strings on Clé de Fa</h3>
          <table class="g-table g-table-left">
            <thead>
              <tr><th>Staff Position</th><th>Open Note</th><th>Circle</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><b>4th Space</b> (top space)</td>
                <td class="cell-accent"><b>${n('Sol', 'G')}</b> string</td>
                <td>1h</td>
              </tr>
              <tr>
                <td><b>3rd Line</b> (middle line)</td>
                <td class="cell-accent"><b>${n('Ré', 'D')}</b> string</td>
                <td>2h</td>
              </tr>
              <tr>
                <td><b>1st Space</b> (bottom space)</td>
                <td class="cell-accent"><b>${n('La', 'A')}</b> string</td>
                <td>3h</td>
              </tr>
              <tr>
                <td><b>1st Ledger Below</b></td>
                <td class="cell-accent"><b>${n('Mi', 'E')}</b> string</td>
                <td>4h</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="g-card g-compact-list">
          <h3 class="g-heading">Lines &amp; Spaces Bottom → Top</h3>
          <div><b>5 Lines</b> — <b>${n('Sol · Si · Ré · Fa · La', 'G · B · D · F · A')}</b></div>
          <div><b>4 Spaces</b> — <b>${n('La · Do · Mi · Sol', 'A · C · E · G')}</b></div>
        </div>
      `
    },
    {
      title: 'Circle Geometry',
      html: `
        <div class="g-card">
          <h3 class="g-heading">Clock Steps from Root <span class="g-sub">(1 = any position)</span></h3>
          <table class="g-table">
            <thead>
              <tr><th>Step</th><th>CW (+5ths / Bright)</th><th>CCW (+4ths / Warm)</th></tr>
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
                <td class="cell-accent"><b>7</b> · −1 fret below!</td>
                <td class="cell-accent"><b>♭2</b> · +1 fret above!</td>
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
          <div><b>Major (7 slices)</b> — <b>4</b> (−1 CCW) through <b>1, 5, 2, 6, 3, 7</b> (+5 CW).</div>
          <div><b>Dorian Funk (7 slices)</b> — Mirror-symmetric around <b>1</b>: <b>♭3, ♭7, 4, [1], 5, 2, 6</b> (−3 to +3!).</div>
          <div><b>Natural Minor (7 slices)</b> — <b>♭6, ♭3, ♭7, 4, 1, 5, 2</b> (−4 to +2).</div>
          <div><b>Minor Pentatonic (5 slices)</b> — <b>♭3, ♭7, 4, 1, 5</b>.</div>
        </div>
      `
    },
    {
      title: 'Chords & Degree Math',
      html: `
        <div class="g-card">
          <h3 class="g-heading">7th Chord Constellations</h3>
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
        </div>
      `
    },
    {
      title: 'Walking & Voice-Leading',
      html: `
        <div class="g-card g-compact-list">
          <h3 class="g-heading">7 → 3 Walking Bass Resolution</h3>
          <div>When chords move <b>CCW in 4ths</b> (${n('Ré m7 → Sol 7 → Do Maj7', 'Dm7 → G7 → CMaj7')}), the <b>♭7</b> of chord A drops <b>1 fret (+5 CW)</b> into the <b>3</b> of chord B!</div>
          <div>• <b>♭7</b> of <b>ii7</b> (= <b>1</b>) → <b>3</b> of <b>V7</b> (= <b>7</b>)</div>
          <div>• <b>♭7</b> of <b>V7</b> (= <b>4</b>) → <b>3</b> of <b>IMaj7</b> (= <b>3</b>)</div>
        </div>

        <div class="g-card g-compact-list">
          <h3 class="g-heading">Chromatic Approaches &amp; Tritone Sub</h3>
          <div><b>1 fret below → target</b> — Always <b>+5 steps CW</b> (${n('Si → Do, Ré → Mi♭', 'B → C, D → E♭')}).</div>
          <div><b>1 fret above → target</b> — Always <b>−5 steps CCW</b> (${n('Ré♭ → Do, Si♭ → La', 'D♭ → C, B♭ → A')}).</div>
          <div><b>Tritone Sub (♭II7 → I)</b> — Opposite <b>V7</b> on the Circle; shares the exact same <b>3 ↔ ♭7</b> guide tones!</div>
        </div>
      `
    },
    {
      title: 'Bass Neck ↔ Stage',
      html: `
        <div class="g-card g-compact-list">
          <h3 class="g-heading">4-String Tuning IS the Circle</h3>
          <div>Open strings <b>${n('Mi → La → Ré → Sol', 'E → A → D → G')}</b> sit at <b>4h → 3h → 2h → 1h</b>!</div>
          <div>• <b>1 string higher, same fret</b> = +4th = <b>−1 step CCW</b>.</div>
          <div>• <b>1 string lower, same fret</b> = +5th = <b>+1 step CW</b>.</div>
          <div>• <b>Same note on next higher string</b> = <b>−5 frets</b> (except open/12th).</div>
        </div>

        <div class="g-card">
          <h3 class="g-heading">Solfège ↔ Real-Book Notation</h3>
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
