// BassCircle — Main Application Controller

import {
  HARMONIC_LENSES,
  INTERVALS,
  mod,
  posToPitchClass,
  getBassFretInfo
} from './theory.js';

import {
  getDefinitionById,
  instantiateQuiz
} from './quizzes.js';

import {
  CircleView,
  renderBassFretboard,
  renderMiniMasteryWheel,
  buildExplorerModel
} from './circle.js';

import {
  reviewCard,
  getMasteryScore,
  buildQuizSession
} from './fsrs.js';

import {
  requestPersistentStorage,
  syncDeckAndGetAllCards,
  saveCardProgress,
  resetAllProgress,
  getSettings,
  saveSettings,
  exportBackupPayload,
  importBackupPayload
} from './db.js';

import {
  setSoundEnabled,
  unlockAudio,
  playBassNote,
  playMutedThud,
  playBassSequence
} from './audio.js';

import { getTheoryPages } from './cheatsheet.js';

// --- DOM REFERENCES ---
const views = {
  menu: document.getElementById('view-menu'),
  quiz: document.getElementById('view-quiz'),
  complete: document.getElementById('view-complete'),
  explore: document.getElementById('view-explore'),
  theory: document.getElementById('view-theory')
};

// Menu DOM
const btnMenuNotation = document.getElementById('btn-menu-notation');
const btnMenuSound = document.getElementById('btn-menu-sound');
const deckCountEl = document.getElementById('deck-count');
const miniWheelSvg = document.getElementById('mini-wheel-svg');
const curveAreaEl = document.getElementById('curve-area');
const curveLineEl = document.getElementById('curve-line');
const btnGoMixed = document.getElementById('btn-go-mixed');
const btnGoExplore = document.getElementById('btn-go-explore');
const btnGoTheory = document.getElementById('btn-go-theory');
const menuStatusEl = document.getElementById('menu-status');
const btnExport = document.getElementById('btn-export');
const btnImport = document.getElementById('btn-import');
const fileImport = document.getElementById('file-import');
const btnReset = document.getElementById('btn-reset');
const btnConfirmReset = document.getElementById('btn-confirm-reset');

// Quiz DOM
const btnQuizNotation = document.getElementById('btn-quiz-notation');
const btnQuizSound = document.getElementById('btn-quiz-sound');
const quizCounterEl = document.getElementById('quiz-counter');
const quizEyebrowEl = document.getElementById('quiz-eyebrow');
const quizStepsRowEl = document.getElementById('quiz-steps-row');
const quizPromptEl = document.getElementById('quiz-prompt');
const quizFretboardWrapEl = document.getElementById('quiz-fretboard-wrap');
const quizCircleMountEl = document.getElementById('quiz-circle-mount');
const quizFooterActiveEl = document.getElementById('quiz-footer-active');
const quizLiveHintEl = document.getElementById('quiz-live-hint');
const btnReveal = document.getElementById('btn-reveal');
const quizFooterDoneEl = document.getElementById('quiz-footer-done');
const quizExplanationEl = document.getElementById('quiz-explanation');
const btnNextQuestion = document.getElementById('btn-next-question');

// Complete Summary DOM
const completeTitleEl = document.getElementById('complete-title');
const sumWellEl = document.getElementById('sum-well');
const sumApproxEl = document.getElementById('sum-approx');
const sumNotEl = document.getElementById('sum-not');
const btnAgainSession = document.getElementById('btn-again-session');
const btnFinishSession = document.getElementById('btn-finish-session');

// Explore DOM
const exploreSummaryEl = document.getElementById('explore-summary');
const btnExploreNeckMode = document.getElementById('btn-explore-neck-mode');
const btnExploreNotation = document.getElementById('btn-explore-notation');
const exploreLensBarEl = document.getElementById('explore-lens-bar');
const exploreCircleMountEl = document.getElementById('explore-circle-mount');
const exploreLensSubtitleEl = document.getElementById('explore-lens-subtitle');
const exploreFretboardMountEl = document.getElementById('explore-fretboard-mount');

// Theory DOM
const theoryPageTitleEl = document.getElementById('theory-page-title');
const theoryCounterEl = document.getElementById('theory-counter');
const theoryTrackEl = document.getElementById('theory-track');
const theoryDotsEl = document.getElementById('theory-dots');
const btnTheoryPrev = document.getElementById('btn-theory-prev');
const btnTheoryNext = document.getElementById('btn-theory-next');

// --- APP STATE ---
let allCards = [];
let settings = { notation: 'solfege', sound: true };
let activeView = 'menu';
let statusTimer = null;
let resetConfirmTimer = null;

// Quiz Session State
let activeSessionCategory = null; // null = mixed, or category id
let sessionQueue = [];
let sessionIndex = 0;
let sessionStats = { well: 0, approx: 0, not: 0 };

let currentQuestionSeed = 1;
let currentSpec = null;
let currentNodesState = [];
let currentStepIndex = 0;
let mistakesOnCurrent = 0;
let wasRevealed = false;
let isQuestionDone = false;
let questionShownAt = 0;
let autoAdvanceTimer = null;

// Explorer State
let exploreRootPos = 0;
let exploreLensKey = 'major';
let exploreNeckMode = 'degree'; // 'degree' | 'note'

// Theory State
let currentTheoryPage = 0;

// --- CIRCLE COMPONENT INSTANCES ---
const quizCircle = new CircleView(quizCircleMountEl, {
  onTapPosition: (pos) => handleQuizCircleTap(pos),
  onTapHub: () => handleQuizHubTap()
});

const exploreCircle = new CircleView(exploreCircleMountEl, {
  onTapPosition: (pos) => handleExploreCircleTap(pos),
  onTapHub: () => playExploreChord()
});

// --- NAVIGATION & SETTINGS SYNC ---

function clearAutoAdvance() {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

function showView(name) {
  clearAutoAdvance();
  cancelResetConfirm();
  activeView = name;
  for (const [key, el] of Object.entries(views)) {
    el.classList.toggle('is-active', key === name);
  }
}

function showMenuStatus(msg) {
  menuStatusEl.textContent = msg;
  if (statusTimer) clearTimeout(statusTimer);
  if (msg) {
    statusTimer = setTimeout(() => {
      menuStatusEl.textContent = '';
    }, 3200);
  }
}

function syncSettingsUI() {
  const isSol = settings.notation !== 'letter';
  btnMenuNotation.textContent = isSol ? 'Do Ré Mi' : 'C D E';
  btnQuizNotation.textContent = isSol ? 'Do Ré Mi' : 'C D E';
  btnExploreNotation.textContent = isSol ? 'Do' : 'C';

  setSoundEnabled(settings.sound);
  for (const btn of [btnMenuSound, btnQuizSound]) {
    btn.classList.toggle('is-muted', !settings.sound);
    const onIcon = btn.querySelector('.icon-sound-on');
    const offIcon = btn.querySelector('.icon-sound-off');
    if (onIcon) onIcon.classList.toggle('is-gone', !settings.sound);
    if (offIcon) offIcon.classList.toggle('is-gone', settings.sound);
  }
}

async function toggleNotation() {
  unlockAudio();
  const nextNotation = settings.notation === 'letter' ? 'solfege' : 'letter';
  settings = await saveSettings({ notation: nextNotation });
  syncSettingsUI();

  if (activeView === 'quiz' && sessionQueue[sessionIndex]) {
    rerenderCurrentQuizNotation();
  } else if (activeView === 'explore') {
    renderExplorer();
  } else if (activeView === 'theory') {
    renderTheoryPages();
    goToTheoryPage(currentTheoryPage, false);
  }
}

async function toggleSound() {
  unlockAudio();
  const nextSound = !settings.sound;
  settings = await saveSettings({ sound: nextSound });
  syncSettingsUI();
  if (nextSound) {
    playBassNote(43, { duration: 0.32, gainScale: 0.7 });
  }
}

// --- HOME MASTERY VISUALIZATIONS ---

function getCardCirclePositions(card) {
  const def = getDefinitionById(card.id);
  if (!def) return [];
  const p = def.params || {};
  if (typeof p.targetPos === 'number') return [mod(p.targetPos, 12)];
  if (typeof p.anchorPos === 'number') return [mod(p.anchorPos, 12)];
  if (typeof p.rootPos === 'number') return [mod(p.rootPos, 12)];
  if (typeof p.keyPos === 'number') return [mod(p.keyPos, 12)];
  if (typeof p.majorPos === 'number') return [mod(p.majorPos, 12)];
  if (typeof p.minorPos === 'number') return [mod(p.minorPos, 12)];
  if (typeof p.targetKeyPos === 'number') return [mod(p.targetKeyPos, 12)];
  if (typeof p.stringIndex === 'number' && typeof p.fret === 'number') {
    return [getBassFretInfo(p.stringIndex, p.fret).pos];
  }
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
}

function renderMasteryDashboard(cards) {
  const total = cards.length;
  const now = Date.now();
  const practiced = cards.filter((c) => (c.reps || 0) > 0).length;
  deckCountEl.textContent = `${practiced} / ${total}`;

  // 1. Mini 12-Sector Circle Mastery Wheel
  const sums = new Array(12).fill(0);
  const counts = new Array(12).fill(0);
  const scores = cards.map((c) => {
    const s = (c.reps || 0) > 0 ? getMasteryScore(c, now) : 0;
    for (const pos of getCardCirclePositions(c)) {
      sums[pos] += s;
      counts[pos] += 1;
    }
    return getMasteryScore(c, now);
  });

  const sectorScores = sums.map((sum, idx) => (counts[idx] > 0 ? sum / counts[idx] : 0));
  renderMiniMasteryWheel(miniWheelSvg, sectorScores);

  // 2. Smooth Gaussian KDE Knowledge Distribution Curve
  if (total === 0) {
    curveAreaEl.setAttribute('d', '');
    curveLineEl.setAttribute('d', '');
    return;
  }

  const xStart = 6;
  const xEnd = 234;
  const yBase = 68;
  const maxHeight = 54;
  const steps = 68;
  const bandwidth = 0.085;
  const invTwoSigmaSq = 1 / (2 * bandwidth * bandwidth);

  const densities = [];
  let maxDensity = 0;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let sum = 0;
    for (let j = 0; j < scores.length; j++) {
      const diff = t - scores[j];
      sum += Math.exp(-(diff * diff) * invTwoSigmaSq);
    }
    densities.push(sum);
    if (sum > maxDensity) maxDensity = sum;
  }

  if (maxDensity <= 0) {
    curveAreaEl.setAttribute('d', '');
    curveLineEl.setAttribute('d', '');
    return;
  }

  const pts = densities.map((d, i) => [
    xStart + (i / steps) * (xEnd - xStart),
    yBase - (d / maxDensity) * maxHeight
  ]);
  const linePath = pts
    .map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${xEnd},${yBase} L${xStart},${yBase} Z`;

  curveLineEl.setAttribute('d', linePath);
  curveAreaEl.setAttribute('d', areaPath);
}

async function refreshMenu() {
  allCards = await syncDeckAndGetAllCards();
  renderMasteryDashboard(allCards);
}

// --- INTERACTIVE CIRCLE QUIZ FLOW ---

function renderStepChips() {
  quizStepsRowEl.textContent = '';
  if (!currentSpec || currentSpec.steps.length <= 1) return;

  // Up to 6 chips shown directly; for 7+ steps show compact progress pill
  if (currentSpec.steps.length > 6) {
    const chip = document.createElement('span');
    chip.className = 'step-chip is-current';
    const shownStep = Math.min(currentStepIndex + 1, currentSpec.steps.length);
    chip.textContent = isQuestionDone
      ? `${currentSpec.steps.length} / ${currentSpec.steps.length}`
      : `${shownStep} / ${currentSpec.steps.length}`;
    quizStepsRowEl.appendChild(chip);
    return;
  }

  currentSpec.steps.forEach((step, idx) => {
    const chip = document.createElement('span');
    chip.className = 'step-chip';
    if (idx < currentStepIndex || isQuestionDone) {
      chip.classList.add('is-done');
    } else if (idx === currentStepIndex) {
      chip.classList.add('is-current');
    }
    chip.textContent = step.stepChipLabel;
    quizStepsRowEl.appendChild(chip);
  });
}

function renderQuizPromptAndNeck() {
  quizEyebrowEl.textContent = currentSpec.eyebrow;
  quizPromptEl.innerHTML = currentSpec.promptHtml;
  renderStepChips();

  if (currentSpec.fretboard) {
    quizFretboardWrapEl.classList.remove('is-gone');
    renderBassFretboard(quizFretboardWrapEl, {
      notation: settings.notation,
      singleDot: {
        stringIndex: currentSpec.fretboard.stringIndex,
        fret: currentSpec.fretboard.fret
      }
    });
  } else {
    quizFretboardWrapEl.classList.add('is-gone');
    quizFretboardWrapEl.textContent = '';
  }
}

function loadCurrentQuizQuestion() {
  clearAutoAdvance();
  const card = sessionQueue[sessionIndex];
  if (!card) {
    finishQuizSession();
    return;
  }

  currentQuestionSeed = Math.floor(Math.random() * 2147483640) + 1;
  currentSpec = instantiateQuiz(card, settings.notation, currentQuestionSeed);
  currentNodesState = currentSpec.nodes.map((n) => ({ ...n }));
  currentStepIndex = 0;
  mistakesOnCurrent = 0;
  wasRevealed = false;
  isQuestionDone = false;
  questionShownAt = Date.now();

  quizCounterEl.textContent = `${sessionIndex + 1} / ${sessionQueue.length}`;
  renderQuizPromptAndNeck();

  quizCircle.setSectors([]);
  quizCircle.clearGeometry();
  quizCircle.setNodes(currentNodesState);

  const firstStep = currentSpec.steps[0];
  quizCircle.setHub(firstStep.centerLabel, firstStep.centerSub, {
    interactive: false,
    done: false
  });

  quizLiveHintEl.textContent =
    currentSpec.steps.length > 1
      ? `Tap ${firstStep.centerLabel} on the Circle`
      : 'Tap the Circle to answer';
  quizFooterActiveEl.classList.remove('is-gone');
  quizFooterDoneEl.classList.add('is-gone');

  // On fretboard questions, subtly pluck the bass fret on question entry so ear & eye connect!
  if (currentSpec.fretboard) {
    const info = getBassFretInfo(
      currentSpec.fretboard.stringIndex,
      currentSpec.fretboard.fret
    );
    playBassNote(info.midi, { duration: 0.55, gainScale: 0.85 });
  }
}

/**
 * Live-updates labels on the current quiz question if user switches Do Ré Mi <-> C D E mid-drill.
 */
function rerenderCurrentQuizNotation() {
  const card = sessionQueue[sessionIndex];
  if (!card) return;

  const updatedSpec = instantiateQuiz(card, settings.notation, currentQuestionSeed);
  currentSpec = updatedSpec;
  renderQuizPromptAndNeck();

  currentNodesState = updatedSpec.nodes.map((baseNode, pos) => {
    // Re-apply any already completed steps
    for (let i = 0; i < currentStepIndex; i++) {
      const st = updatedSpec.steps[i];
      if (st.targetPos === pos) {
        return {
          ...baseNode,
          mode: isQuestionDone && i === updatedSpec.steps.length - 1 ? 'correct' : 'placed',
          primary: st.revealedPrimary,
          secondary: st.revealedSecondary || '',
          subBadge: st.revealedSub || baseNode.subBadge
        };
      }
    }
    return { ...baseNode };
  });

  quizCircle.setNodes(currentNodesState);

  if (isQuestionDone) {
    quizCircle.setHub(updatedSpec.doneCenterPrimary, updatedSpec.doneCenterSub, {
      interactive: true,
      done: true
    });
    quizExplanationEl.textContent = updatedSpec.explanation;
  } else {
    const step = updatedSpec.steps[currentStepIndex];
    quizCircle.setHub(step.centerLabel, step.centerSub, {
      interactive: false,
      done: false
    });
  }
}

async function completeCurrentQuestion() {
  isQuestionDone = true;
  renderStepChips();
  quizCircle.renderGeometry(currentSpec.geometry);
  quizCircle.setHub(currentSpec.doneCenterPrimary, currentSpec.doneCenterSub, {
    interactive: true,
    done: true
  });

  quizExplanationEl.textContent = currentSpec.explanation;
  quizFooterActiveEl.classList.add('is-gone');
  quizFooterDoneEl.classList.remove('is-gone');

  // Compute objective FSRS rating from tap accuracy & hesitation
  const elapsedMs = Date.now() - questionShownAt;
  let rating = 3;
  if (wasRevealed || mistakesOnCurrent >= 2) {
    rating = 1;
    sessionStats.not += 1;
  } else if (
    mistakesOnCurrent === 1 ||
    (currentSpec.steps.length === 1 && elapsedMs > 9500)
  ) {
    rating = 2;
    sessionStats.approx += 1;
  } else {
    rating = 3;
    sessionStats.well += 1;
  }

  const currentCard = sessionQueue[sessionIndex];
  if (currentCard) {
    const updatedCard = reviewCard(currentCard, rating, Date.now());
    sessionQueue[sessionIndex] = updatedCard;
    await saveCardProgress(updatedCard);
  }

  // Flow-state auto-advance when nailed cleanly on first try; pause to study when missed/revealed!
  if (mistakesOnCurrent === 0 && !wasRevealed) {
    clearAutoAdvance();
    autoAdvanceTimer = setTimeout(() => {
      autoAdvanceTimer = null;
      advanceToNextQuestion();
    }, 940);
  }
}

function handleQuizCircleTap(pos) {
  unlockAudio();
  if (!currentSpec) return;

  if (isQuestionDone) {
    advanceToNextQuestion();
    return;
  }

  const step = currentSpec.steps[currentStepIndex];
  if (!step) return;

  if (pos === step.targetPos) {
    const isLast = currentStepIndex === currentSpec.steps.length - 1;
    const base = currentNodesState[pos];
    const nextState = {
      ...base,
      mode: isLast ? 'correct' : 'placed',
      primary: step.revealedPrimary,
      secondary: step.revealedSecondary || '',
      subBadge: step.revealedSub || base.subBadge
    };
    currentNodesState[pos] = nextState;
    quizCircle.updateSingleNode(pos, nextState);
    quizCircle.pulseNode(pos);

    if (currentSpec.steps.length === 1 && currentSpec.rootMidiPreview !== undefined) {
      playBassSequence([currentSpec.rootMidiPreview, step.midiToPlay], 0.11);
    } else {
      playBassNote(step.midiToPlay, { duration: 0.52 });
    }

    currentStepIndex += 1;

    if (currentStepIndex >= currentSpec.steps.length) {
      completeCurrentQuestion();
    } else {
      renderStepChips();
      const nextStep = currentSpec.steps[currentStepIndex];
      quizCircle.setHub(nextStep.centerLabel, nextStep.centerSub, {
        interactive: false,
        done: false
      });
      quizLiveHintEl.textContent = `Next: tap ${nextStep.centerLabel}`;
    }
  } else {
    mistakesOnCurrent += 1;
    playMutedThud();
    const flashText = currentSpec.nodes[pos]?.wrongFlashLabel || '';
    quizCircle.flashWrongNode(pos, currentNodesState[pos], flashText);
    quizLiveHintEl.textContent =
      mistakesOnCurrent >= 2
        ? 'Not there — try again or tap Show'
        : flashText
        ? `That slot is ${flashText} — try again`
        : 'Try another position on the Circle';
  }
}

function handleQuizHubTap() {
  unlockAudio();
  if (isQuestionDone) {
    advanceToNextQuestion();
  }
}

function handleRevealAnswer() {
  unlockAudio();
  if (!currentSpec || isQuestionDone) return;
  wasRevealed = true;

  const remainingMidis = [];
  for (let i = currentStepIndex; i < currentSpec.steps.length; i++) {
    const step = currentSpec.steps[i];
    const isLast = i === currentSpec.steps.length - 1;
    const base = currentNodesState[step.targetPos];
    currentNodesState[step.targetPos] = {
      ...base,
      mode: isLast ? 'correct' : 'placed',
      primary: step.revealedPrimary,
      secondary: step.revealedSecondary || '',
      subBadge: step.revealedSub || base.subBadge
    };
    remainingMidis.push(step.midiToPlay);
  }

  currentStepIndex = currentSpec.steps.length;
  quizCircle.setNodes(currentNodesState);
  playBassSequence(remainingMidis.slice(0, 5), 0.13);
  completeCurrentQuestion();
}

function advanceToNextQuestion() {
  clearAutoAdvance();
  sessionIndex += 1;
  if (sessionIndex >= sessionQueue.length) {
    finishQuizSession();
  } else {
    loadCurrentQuizQuestion();
  }
}

function finishQuizSession() {
  clearAutoAdvance();
  const totalAnswered =
    sessionStats.well + sessionStats.approx + sessionStats.not;

  if (totalAnswered === 0) {
    refreshMenu().then(() => showView('menu'));
    return;
  }

  completeTitleEl.textContent =
    totalAnswered === 1 ? '1 drill complete' : `${totalAnswered} drills complete`;
  sumWellEl.textContent = String(sessionStats.well);
  sumApproxEl.textContent = String(sessionStats.approx);
  sumNotEl.textContent = String(sessionStats.not);

  showView('complete');
}

async function startQuizSession(category = null) {
  unlockAudio();
  allCards = await syncDeckAndGetAllCards();
  activeSessionCategory = category;

  const sessionSize = category ? 12 : 18;
  sessionQueue = buildQuizSession(allCards, {
    category,
    sessionSize,
    now: Date.now()
  });

  if (!sessionQueue.length) return;
  sessionIndex = 0;
  sessionStats = { well: 0, approx: 0, not: 0 };

  showView('quiz');
  loadCurrentQuizQuestion();
}

// --- INTERACTIVE CIRCLE & BASS FRETBOARD EXPLORER ---

function initExploreLensBar() {
  exploreLensBarEl.textContent = '';
  for (const lens of Object.values(HARMONIC_LENSES)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lens-pill';
    btn.dataset.lens = lens.id;
    btn.textContent = lens.label;
    btn.addEventListener('click', () => {
      unlockAudio();
      exploreLensKey = lens.id;
      renderExplorer();
      playExploreChord();
    });
    exploreLensBarEl.appendChild(btn);
  }
}

function renderExplorer() {
  const lens = HARMONIC_LENSES[exploreLensKey] || HARMONIC_LENSES.major;

  for (const pill of exploreLensBarEl.children) {
    pill.classList.toggle('is-active', pill.dataset.lens === lens.id);
  }

  btnExploreNeckMode.textContent =
    exploreNeckMode === 'degree' ? '1·3·5' : 'Notes';

  const model = buildExplorerModel(
    exploreRootPos,
    lens,
    settings.notation,
    exploreNeckMode
  );

  exploreSummaryEl.textContent = `${model.rootName} · ${model.sigLabel} · rel. ${model.relMinName}`;
  exploreLensSubtitleEl.textContent = lens.subtitle;

  exploreCircle.setSectors(model.sectorPositions);
  exploreCircle.setNodes(model.nodes);
  exploreCircle.renderGeometry(model.geometry);
  exploreCircle.setHub(model.rootName, `${lens.label} ▶`, {
    interactive: true,
    done: false
  });

  renderBassFretboard(exploreFretboardMountEl, {
    notation: settings.notation,
    activeMap: model.activeMap,
    onTapFret: ({ midi, pos }) => {
      unlockAudio();
      playBassNote(midi, { duration: 0.56 });
      exploreCircle.pulseNode(pos);
    }
  });
}

function handleExploreCircleTap(pos) {
  unlockAudio();
  exploreRootPos = pos;
  renderExplorer();
  const basePc = posToPitchClass(pos);
  playBassNote(36 + basePc, { duration: 0.55 });
}

function playExploreChord() {
  unlockAudio();
  const lens = HARMONIC_LENSES[exploreLensKey] || HARMONIC_LENSES.major;
  const basePc = posToPitchClass(exploreRootPos);
  const rootMidi = 36 + basePc;
  const midis = lens.chordTones.map((sym) => rootMidi + INTERVALS[sym].semitones);
  playBassSequence(midis, 0.14);
}

function openExploreView() {
  unlockAudio();
  showView('explore');
  renderExplorer();
}

// --- 5-PAGE THEORY CHEAT SHEET ---

function renderTheoryPages() {
  const pages = getTheoryPages(settings.notation);
  theoryTrackEl.textContent = '';
  theoryDotsEl.textContent = '';

  pages.forEach((page, idx) => {
    const slide = document.createElement('article');
    slide.className = 'grammar-slide';
    slide.setAttribute('aria-label', page.title);
    slide.innerHTML = page.html;
    theoryTrackEl.appendChild(slide);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'grammar-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `${idx + 1}. ${page.title}`);
    dot.addEventListener('click', () => goToTheoryPage(idx, true));
    theoryDotsEl.appendChild(dot);
  });

  updateTheoryHeader(currentTheoryPage);
}

function updateTheoryHeader(idx) {
  const pages = getTheoryPages(settings.notation);
  const total = pages.length;
  const safeIdx = Math.max(0, Math.min(total - 1, idx));
  currentTheoryPage = safeIdx;

  theoryPageTitleEl.textContent = pages[safeIdx].title;
  theoryCounterEl.textContent = `${safeIdx + 1} / ${total}`;
  btnTheoryPrev.disabled = safeIdx === 0;
  btnTheoryNext.disabled = safeIdx === total - 1;

  const dots = theoryDotsEl.children;
  for (let i = 0; i < dots.length; i++) {
    const active = i === safeIdx;
    dots[i].classList.toggle('is-active', active);
    dots[i].setAttribute('aria-selected', String(active));
  }
}

function goToTheoryPage(idx, smooth = true) {
  const pages = getTheoryPages(settings.notation);
  const safeIdx = Math.max(0, Math.min(pages.length - 1, idx));
  const width = theoryTrackEl.clientWidth;
  updateTheoryHeader(safeIdx);
  if (smooth) {
    theoryTrackEl.scrollTo({ left: safeIdx * width, behavior: 'smooth' });
  } else {
    theoryTrackEl.scrollLeft = safeIdx * width;
  }
}

let theoryScrollRaf = null;
theoryTrackEl.addEventListener('scroll', () => {
  if (theoryScrollRaf) return;
  theoryScrollRaf = requestAnimationFrame(() => {
    theoryScrollRaf = null;
    const width = theoryTrackEl.clientWidth;
    if (width > 0) {
      const idx = Math.round(theoryTrackEl.scrollLeft / width);
      if (idx !== currentTheoryPage) {
        updateTheoryHeader(idx);
      }
    }
  });
});

function openTheoryView() {
  renderTheoryPages();
  showView('theory');
  requestAnimationFrame(() => {
    goToTheoryPage(currentTheoryPage, false);
  });
}

// --- BACKUP EXPORT, IMPORT & SAFE RESET ---

async function handleExportBackup() {
  const payload = await exportBackupPayload();
  if (!payload.cards.length) {
    showMenuStatus('Play a quiz first to export progress');
    return;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `basscircle-backup-${stamp}.json`;
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });

  try {
    if (typeof File !== 'undefined' && navigator.canShare) {
      const file = new File([blob], fileName, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
        showMenuStatus('Backup saved');
        return;
      }
    }
  } catch (err) {
    if (err && err.name === 'AbortError') return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  showMenuStatus('Backup downloaded');
}

async function handleImportBackup(file) {
  if (!file) return;
  try {
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    const { restored } = await importBackupPayload(parsed);
    settings = await getSettings();
    syncSettingsUI();
    await refreshMenu();
    showMenuStatus(`Restored ${restored} ${restored === 1 ? 'drill' : 'drills'}`);
  } catch {
    showMenuStatus('Invalid backup file');
  } finally {
    fileImport.value = '';
  }
}

function cancelResetConfirm() {
  if (resetConfirmTimer) {
    clearTimeout(resetConfirmTimer);
    resetConfirmTimer = null;
  }
  btnReset.classList.remove('is-gone');
  btnConfirmReset.classList.add('is-gone');
}

function promptResetProgress() {
  btnReset.classList.add('is-gone');
  btnConfirmReset.classList.remove('is-gone');
  resetConfirmTimer = setTimeout(cancelResetConfirm, 4000);
}

async function confirmResetProgress() {
  cancelResetConfirm();
  await resetAllProgress();
  await refreshMenu();
  showMenuStatus('Progress reset');
}

// --- EVENT LISTENERS ---

btnMenuNotation.addEventListener('click', toggleNotation);
btnQuizNotation.addEventListener('click', toggleNotation);
btnExploreNotation.addEventListener('click', toggleNotation);

btnMenuSound.addEventListener('click', toggleSound);
btnQuizSound.addEventListener('click', toggleSound);

btnGoMixed.addEventListener('click', () => startQuizSession(null));

document.querySelectorAll('.btn-mode[data-mode]').forEach((btn) => {
  btn.addEventListener('click', () => startQuizSession(btn.dataset.mode));
});

btnGoExplore.addEventListener('click', openExploreView);
btnGoTheory.addEventListener('click', openTheoryView);

btnReveal.addEventListener('click', handleRevealAnswer);
btnNextQuestion.addEventListener('click', () => {
  unlockAudio();
  advanceToNextQuestion();
});

btnAgainSession.addEventListener('click', () => startQuizSession(activeSessionCategory));
btnFinishSession.addEventListener('click', async () => {
  await refreshMenu();
  showView('menu');
});

btnExploreNeckMode.addEventListener('click', () => {
  unlockAudio();
  exploreNeckMode = exploreNeckMode === 'degree' ? 'note' : 'degree';
  renderExplorer();
});

btnTheoryPrev.addEventListener('click', () => goToTheoryPage(currentTheoryPage - 1, true));
btnTheoryNext.addEventListener('click', () => goToTheoryPage(currentTheoryPage + 1, true));

document.querySelectorAll('[data-go="menu"]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    await refreshMenu();
    showView('menu');
  });
});

btnExport.addEventListener('click', handleExportBackup);
btnImport.addEventListener('click', () => fileImport.click());
fileImport.addEventListener('change', (e) => handleImportBackup(e.target.files?.[0]));

btnReset.addEventListener('click', promptResetProgress);
btnConfirmReset.addEventListener('click', confirmResetProgress);

document.addEventListener('keydown', (e) => {
  if (activeView === 'quiz') {
    if ((e.key === ' ' || e.key === 'Enter') && isQuestionDone) {
      e.preventDefault();
      advanceToNextQuestion();
    } else if (e.key === 'Escape') {
      refreshMenu().then(() => showView('menu'));
    }
  } else if (activeView === 'theory') {
    if (e.key === 'ArrowLeft') goToTheoryPage(currentTheoryPage - 1, true);
    else if (e.key === 'ArrowRight') goToTheoryPage(currentTheoryPage + 1, true);
    else if (e.key === 'Escape') showView('menu');
  } else if (activeView === 'explore' && e.key === 'Escape') {
    showView('menu');
  }
});

// --- BOOTSTRAP & SERVICE WORKER ---

async function init() {
  requestPersistentStorage();
  settings = await getSettings();
  syncSettingsUI();
  initExploreLensBar();
  renderTheoryPages();
  await refreshMenu();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

init();
