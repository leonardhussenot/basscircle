// Zero-dependency Web Audio Electric Bass Synthesizer (optimized for iPhone speakers & headphones)

let audioCtx = null;
let soundEnabled = true;
let unlocked = false;

export function setSoundEnabled(enabled) {
  soundEnabled = Boolean(enabled);
}

export function isSoundEnabled() {
  return soundEnabled;
}

function getContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  return audioCtx;
}

export function unlockAudio() {
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (!unlocked) {
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      unlocked = true;
    }
  } catch {
    // Ignore audio context restrictions
  }
}

function midiToFreq(midi) {
  // Keep in warm, audible finger-bass register (E1=28 up to G4=67)
  // Boost sub-33 notes by an octave of strong 2nd harmonic so iPhone speakers sing clearly
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Plucks a warm fingerstyle electric bass note at `midi` pitch.
 */
export function playBassNote(midi = 36, { delay = 0, duration = 0.58, gainScale = 1 } = {}) {
  if (!soundEnabled) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const t0 = ctx.currentTime + delay;
    // Shift ultra-low notes (< C2 = 36) up to octave 2 fundamental if needed, or reinforce 2nd harmonic
    const effectiveMidi = midi < 31 ? midi + 12 : midi;
    const f = midiToFreq(effectiveMidi);

    const master = ctx.createGain();
    const peak = 0.24 * gainScale;
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.linearRampToValueAtTime(peak, t0 + 0.006);
    master.gain.exponentialRampToValueAtTime(peak * 0.52, t0 + 0.11);
    master.gain.exponentialRampToValueAtTime(0.0008, t0 + duration);
    master.connect(ctx.destination);

    // 1. Warm fundamental body (triangle)
    const oscBody = ctx.createOscillator();
    oscBody.type = 'triangle';
    oscBody.frequency.setValueAtTime(f, t0);

    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(0.75, t0);
    oscBody.connect(bodyGain);
    bodyGain.connect(master);

    // 2. 2nd harmonic warmth (sine at 2f — crucial for small iPhone speakers)
    const oscOct = ctx.createOscillator();
    oscOct.type = 'sine';
    oscOct.frequency.setValueAtTime(f * 2, t0);

    const octGain = ctx.createGain();
    octGain.gain.setValueAtTime(0.46, t0);
    oscOct.connect(octGain);
    octGain.connect(master);

    // 3. Finger-pluck transient (lowpass-filtered sawtooth)
    const oscPluck = ctx.createOscillator();
    oscPluck.type = 'sawtooth';
    oscPluck.frequency.setValueAtTime(f, t0);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(1.3, t0);
    filter.frequency.setValueAtTime(Math.min(2600, f * 7.2), t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(180, f * 2.1), t0 + 0.13);

    const pluckGain = ctx.createGain();
    pluckGain.gain.setValueAtTime(0.28, t0);
    oscPluck.connect(filter);
    filter.connect(pluckGain);
    pluckGain.connect(master);

    const stopAt = t0 + duration + 0.03;
    oscBody.start(t0);
    oscOct.start(t0);
    oscPluck.start(t0);
    oscBody.stop(stopAt);
    oscOct.stop(stopAt);
    oscPluck.stop(stopAt);
  } catch {
    // Never let audio block interaction
  }
}

/**
 * Plays a gentle muted fret thud on a wrong tap.
 */
export function playMutedThud() {
  if (!soundEnabled) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(92, t0);
    osc.frequency.exponentialRampToValueAtTime(52, t0 + 0.085);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t0);
    g.gain.linearRampToValueAtTime(0.14, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.095);

    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.11);
  } catch {
    // Ignore
  }
}

/**
 * Plays an arpeggio or bass walk sequence cleanly.
 */
export function playBassSequence(midis, stepSec = 0.14) {
  if (!soundEnabled || !Array.isArray(midis)) return;
  midis.forEach((m, i) => {
    playBassNote(m, { delay: i * stepSec, duration: 0.48, gainScale: 0.9 });
  });
}
