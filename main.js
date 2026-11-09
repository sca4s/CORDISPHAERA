// ============================================================================
// CORDISPHAERA — Harmonia Kinetica
// "MADE BY SOU."
// ============================================================================

const canvas = document.getElementById('appCanvas');
const ctx = canvas.getContext('2d');
const topHud = document.getElementById('topHud');

// --- Theme State ('light' | 'dark') ---
let currentTheme = 'light';

// --- Responsive Viewport & Layout Metrics ---
let width = window.innerWidth;
let height = window.innerHeight;
let uiScale = 1;
let playTop = 100;
let playBottom = 400;
let staffTop = 420;
let dockHeight = 160;
let bottomMargin = 14;
let marginL = 82;
let marginR = 300;
let fretHeaderY = 82;

let currentInstrument = 'acoustic'; // 'acoustic' | 'electric' | 'bass'
let flowEnabled = true;
let flowSpeed = 2.4;

const lanes = [];
const shapes = [];
const travelers = [];
const orbs = [];
const ripples = [];
const sheetNotes = [];
const ambientSculptures = [];

// Pointer state for strumming vs clicking
let pointerDown = false;
let pointerDragged = false;
let lastPointerY = null;
let pointerStart = { x: 0, y: 0 };

// --- Instrument String Definitions & Pastel Palettes ---
const INSTRUMENT_CONFIGS = {
  acoustic: {
    label: '6 Strings • Warm Wood',
    clef: '𝄞',
    clefOffset: 1.75,
    strings: [
      { name: 'E4', baseFreq: 329.63, baseStep: 0,   color: '#E895B8', glow: '#FAD8E6', thickness: 1.7 },
      { name: 'B3', baseFreq: 246.94, baseStep: -3,  color: '#D598FA', glow: '#EAD4FF', thickness: 2.0 },
      { name: 'G3', baseFreq: 196.00, baseStep: -5,  color: '#A796FA', glow: '#D0C2FF', thickness: 2.3 },
      { name: 'D3', baseFreq: 146.83, baseStep: -8,  color: '#7CC6D4', glow: '#B2E4FA', thickness: 2.6 },
      { name: 'A2', baseFreq: 110.00, baseStep: -11, color: '#78CCA9', glow: '#BCE8D6', thickness: 3.0 },
      { name: 'E2', baseFreq: 82.41,  baseStep: -14, color: '#F5A886', glow: '#FFE5D1', thickness: 3.4 }
    ]
  },
  electric: {
    label: '6 Strings • Shimmer Chorus',
    clef: '𝄞',
    clefOffset: 1.75,
    strings: [
      { name: 'E4', baseFreq: 329.63, baseStep: 0,   color: '#B689E0', glow: '#E3D0F0', thickness: 1.6 },
      { name: 'B3', baseFreq: 246.94, baseStep: -3,  color: '#9C8EEA', glow: '#CFC0FF', thickness: 1.9 },
      { name: 'G3', baseFreq: 196.00, baseStep: -5,  color: '#75B2EA', glow: '#B2E2FA', thickness: 2.1 },
      { name: 'D3', baseFreq: 146.83, baseStep: -8,  color: '#6ED6BA', glow: '#BCE8D6', thickness: 2.4 },
      { name: 'A2', baseFreq: 110.00, baseStep: -11, color: '#F598B8', glow: '#FAD8E6', thickness: 2.7 },
      { name: 'E2', baseFreq: 82.41,  baseStep: -14, color: '#F7AE90', glow: '#FFD0D9', thickness: 3.0 }
    ]
  },
  bass: {
    label: '4 Thick Strings • Deep Sub',
    clef: '𝄢',
    clefOffset: 2.25,
    strings: [
      { name: 'G2', baseFreq: 98.00,  baseStep: 0,  color: '#9E85F5', glow: '#CFC0FF', thickness: 3.4 },
      { name: 'D2', baseFreq: 73.42,  baseStep: -3, color: '#6FBCD9', glow: '#B2E2FA', thickness: 4.0 },
      { name: 'A1', baseFreq: 55.00,  baseStep: -6, color: '#70C4A5', glow: '#BCE8D6', thickness: 4.6 },
      { name: 'E1', baseFreq: 41.20,  baseStep: -9, color: '#EA8FAF', glow: '#FAD8E6', thickness: 5.2 }
    ]
  }
};

const DRUM_DEFS = [
  { id: 'hihat', label: 'HI-HAT', staffStep: 9, color: '#6CC6A8', fill: '#BCE8D6', isCrossNote: true },
  { id: 'snare', label: 'SNARE',  staffStep: 4, color: '#7BAAE0', fill: '#B2E2FA', isCrossNote: false },
  { id: 'kick',  label: 'KICK',   staffStep: 0, color: '#E389A6', fill: '#FAD8E6', isCrossNote: false }
];

const PENTATONIC_ZONES = [
  { semitones: 0,  stepOffset: 0, name: 'Open' },
  { semitones: 2,  stepOffset: 1, name: '+2' },
  { semitones: 4,  stepOffset: 2, name: '+4' },
  { semitones: 7,  stepOffset: 4, name: '+7' },
  { semitones: 12, stepOffset: 7, name: 'Octave' }
];

// ============================================================================
// LIGHT & DARK THEME CONTROLLER
// ============================================================================
function setTheme(mode) {
  currentTheme = mode === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);

  const isDark = currentTheme === 'dark';
  const icon = isDark ? '🌙' : '☀️';
  const label = isDark ? 'Dark' : 'Light';

  const themeIcon = document.getElementById('themeIcon');
  const themeLabel = document.getElementById('themeLabel');
  const frontThemeIcon = document.getElementById('frontThemeIcon');
  const frontThemeText = document.getElementById('frontThemeText');
  const themeMeta = document.getElementById('themeColorMeta');

  if (themeIcon) themeIcon.textContent = icon;
  if (themeLabel) themeLabel.textContent = label;
  if (frontThemeIcon) frontThemeIcon.textContent = icon;
  if (frontThemeText) frontThemeText.textContent = label;
  if (themeMeta) themeMeta.setAttribute('content', isDark ? '#110E1C' : '#F7F2FA');
}

function toggleTheme() {
  setTheme(currentTheme === 'light' ? 'dark' : 'light');
}

document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
document.getElementById('frontThemeBtn').addEventListener('click', toggleTheme);

function initAmbientSculptures() {
  ambientSculptures.length = 0;
  const palette = [
    { c1: '#F9D8E6', c2: '#E895B8' },
    { c1: '#CBB9FF', c2: '#9E85F5' },
    { c1: '#B5EAD7', c2: '#78CCA9' },
    { c1: '#B2E2FA', c2: '#75B2EA' },
    { c1: '#FFE5D0', c2: '#F5A886' },
    { c1: '#FFD0D9', c2: '#EA8FAF' }
  ];
  const kinds = ['sphere', 'ring', 'arch', 'prism', 'capsule'];
  for (let i = 0; i < 11; i++) {
    const pal = palette[i % palette.length];
    ambientSculptures.push({
      x: Math.random() * width,
      y: Math.random() * (height * 0.72),
      radius: (24 + Math.random() * 40) * uiScale,
      kind: kinds[i % kinds.length],
      c1: pal.c1,
      c2: pal.c2,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.16,
      angle: Math.random() * Math.PI * 2,
      vAngle: (Math.random() - 0.5) * 0.004,
      alpha: 0.24 + Math.random() * 0.18
    });
  }
}

// ============================================================================
// GLITCH-PROOF WEB AUDIO SYNTHESIZER (VOICE POOLING & PRE-ALLOCATED BUFFERS)
// ============================================================================
let audioCtx = null;
let masterCompressor = null;
let masterGain = null;
let electricDelaySend = null;
let sharedDriveCurve = null;

// Pre-allocated noise buffers so zero buffers are allocated during strumming
let pluckNoiseBuffer = null;
let snareNoiseBuffer = null;
let hihatNoiseBuffer = null;

// Polyphony management to prevent node overload during rapid continuous strumming
const activeVoices = [];
const MAX_ACTIVE_VOICES = 24;

function createNoiseBuffer(ctxInstance, durationSec, decayFactor) {
  const len = Math.max(1, Math.floor(ctxInstance.sampleRate * durationSec));
  const buf = ctxInstance.createBuffer(1, len, ctxInstance.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * decayFactor));
  }
  return buf;
}

function makeSoftDriveCurve(amount = 14) {
  const k = amount;
  const nSamples = 256;
  const curve = new Float32Array(nSamples);
  const deg = Math.PI / 180;
  for (let i = 0; i < nSamples; ++i) {
    const x = (i * 2) / nSamples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

function ensureAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.85, audioCtx.currentTime);

    masterCompressor = audioCtx.createDynamicsCompressor();
    masterCompressor.threshold.setValueAtTime(-16, audioCtx.currentTime);
    masterCompressor.knee.setValueAtTime(24, audioCtx.currentTime);
    masterCompressor.ratio.setValueAtTime(6, audioCtx.currentTime);
    masterCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
    masterCompressor.release.setValueAtTime(0.18, audioCtx.currentTime);

    masterGain.connect(masterCompressor);
    masterCompressor.connect(audioCtx.destination);

    // Shared Electric Delay Bus (avoids creating new DelayNodes per note)
    const delayNode = audioCtx.createDelay(0.5);
    const delayFeedback = audioCtx.createGain();
    const delayWet = audioCtx.createGain();
    const delayFilter = audioCtx.createBiquadFilter();

    delayNode.delayTime.setValueAtTime(0.19, audioCtx.currentTime);
    delayFeedback.gain.setValueAtTime(0.24, audioCtx.currentTime);
    delayWet.gain.setValueAtTime(0.22, audioCtx.currentTime);
    delayFilter.type = 'lowpass';
    delayFilter.frequency.setValueAtTime(3200, audioCtx.currentTime);

    electricDelaySend = audioCtx.createGain();
    electricDelaySend.gain.setValueAtTime(1.0, audioCtx.currentTime);

    electricDelaySend.connect(delayNode);
    delayNode.connect(delayFilter);
    delayFilter.connect(delayWet);
    delayWet.connect(masterGain);

    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delayNode);

    // Pre-compute distortion curve and noise buffers once
    sharedDriveCurve = makeSoftDriveCurve(14);
    pluckNoiseBuffer = createNoiseBuffer(audioCtx, 0.024, 0.30);
    snareNoiseBuffer = createNoiseBuffer(audioCtx, 0.16, 0.44);
    hihatNoiseBuffer = createNoiseBuffer(audioCtx, 0.06, 0.26);
  }

  if (audioCtx.state === 'suspended' || audioCtx.state === 'interrupted') {
    audioCtx.resume().catch(() => {});
  }
}

// Resume audio automatically if tab visibility changes or window regains focus
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && audioCtx && audioCtx.state !== 'running') {
    audioCtx.resume().catch(() => {});
  }
});

function registerVoice(voiceObj) {
  // Steal oldest voice if polyphony limit is reached
  while (activeVoices.length >= MAX_ACTIVE_VOICES) {
    const oldest = activeVoices.shift();
    if (oldest && !oldest.cleaned) {
      oldest.forceStop();
    }
  }
  activeVoices.push(voiceObj);
}

function clampFilterFreq(freqVal) {
  if (!audioCtx || !Number.isFinite(freqVal)) return 1000;
  const maxSafe = Math.min(14000, audioCtx.sampleRate * 0.42);
  return Math.max(40, Math.min(maxSafe, freqVal));
}

function playGuitarNote(freq, shapeGeo = 'circle') {
  ensureAudio();
  if (!audioCtx || !Number.isFinite(freq)) return;

  const now = audioCtx.currentTime;
  const voiceNodes = [];
  const voiceSources = [];
  let voiceGain = null;

  const voiceRecord = {
    cleaned: false,
    cleanup() {
      if (this.cleaned) return;
      this.cleaned = true;
      const idx = activeVoices.indexOf(this);
      if (idx !== -1) activeVoices.splice(idx, 1);
      for (let i = 0; i < voiceNodes.length; i++) {
        try { voiceNodes[i].disconnect(); } catch (_) {}
      }
    },
    forceStop() {
      if (this.cleaned) return;
      try {
        if (voiceGain && audioCtx) {
          const t = audioCtx.currentTime;
          voiceGain.gain.cancelScheduledValues(t);
          voiceGain.gain.setTargetAtTime(0.0001, t, 0.008);
        }
      } catch (_) {}
      setTimeout(() => {
        for (let i = 0; i < voiceSources.length; i++) {
          try { voiceSources[i].stop(); } catch (_) {}
        }
        this.cleanup();
      }, 28);
    }
  };

  if (currentInstrument === 'acoustic') {
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    voiceGain = gain;

    osc1.type = shapeGeo === 'triangle' ? 'sawtooth' : 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now);

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(1.0, now);
    filter.frequency.setValueAtTime(clampFilterFreq(freq * 6.0), now);
    filter.frequency.exponentialRampToValueAtTime(clampFilterFreq(freq * 1.35), now + 0.95);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.15);

    const noise = audioCtx.createBufferSource();
    const noiseGain = audioCtx.createGain();
    noise.buffer = pluckNoiseBuffer;
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

    osc1.connect(filter);
    osc2.connect(filter);
    noise.connect(noiseGain);
    noiseGain.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    voiceNodes.push(osc1, osc2, noise, noiseGain, filter, gain);
    voiceSources.push(osc1, osc2, noise);

    osc1.onended = () => voiceRecord.cleanup();

    osc1.start(now);
    osc2.start(now);
    noise.start(now);
    osc1.stop(now + 1.18);
    osc2.stop(now + 1.18);

  } else if (currentInstrument === 'electric') {
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const shaper = audioCtx.createWaveShaper();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    voiceGain = gain;

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq, now);
    osc1.detune.setValueAtTime(-6, now);
    osc2.detune.setValueAtTime(6, now);

    shaper.curve = sharedDriveCurve;
    shaper.oversample = 'none';

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(2.2, now);
    filter.frequency.setValueAtTime(clampFilterFreq(freq * 7.2), now);
    filter.frequency.exponentialRampToValueAtTime(clampFilterFreq(freq * 2.0), now + 1.1);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.17, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.3);

    osc1.connect(shaper);
    osc2.connect(shaper);
    shaper.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    gain.connect(electricDelaySend);

    voiceNodes.push(osc1, osc2, shaper, filter, gain);
    voiceSources.push(osc1, osc2);

    osc1.onended = () => voiceRecord.cleanup();

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.34);
    osc2.stop(now + 1.34);

  } else if (currentInstrument === 'bass') {
    const subOsc = audioCtx.createOscillator();
    const bodyOsc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    voiceGain = gain;

    subOsc.type = 'sine';
    bodyOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(freq, now);
    bodyOsc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(2.6, now);
    filter.frequency.setValueAtTime(clampFilterFreq(freq * 6.5), now);
    filter.frequency.exponentialRampToValueAtTime(clampFilterFreq(freq * 1.4), now + 0.36);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.32, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.98);

    subOsc.connect(gain);
    bodyOsc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    voiceNodes.push(subOsc, bodyOsc, filter, gain);
    voiceSources.push(subOsc, bodyOsc);

    subOsc.onended = () => voiceRecord.cleanup();

    subOsc.start(now);
    bodyOsc.start(now);
    subOsc.stop(now + 1.02);
    bodyOsc.stop(now + 1.02);
  }

  registerVoice(voiceRecord);
}

function playDrumSound(drumId) {
  ensureAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  if (drumId === 'kick') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);

    gain.gain.setValueAtTime(0.46, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.onended = () => {
      try { osc.disconnect(); gain.disconnect(); } catch (_) {}
    };
    osc.start(now);
    osc.stop(now + 0.34);

  } else if (drumId === 'snare') {
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(188, now);
    osc.frequency.exponentialRampToValueAtTime(92, now + 0.08);
    oscGain.gain.setValueAtTime(0.20, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(oscGain);
    oscGain.connect(masterGain);

    const noise = audioCtx.createBufferSource();
    noise.buffer = snareNoiseBuffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(950, now);

    const nGain = audioCtx.createGain();
    nGain.gain.setValueAtTime(0.22, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(masterGain);

    osc.onended = () => {
      try { osc.disconnect(); oscGain.disconnect(); } catch (_) {}
    };
    noise.onended = () => {
      try { noise.disconnect(); filter.disconnect(); nGain.disconnect(); } catch (_) {}
    };

    osc.start(now);
    osc.stop(now + 0.14);
    noise.start(now);

  } else if (drumId === 'hihat') {
    const noise = audioCtx.createBufferSource();
    noise.buffer = hihatNoiseBuffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, now);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.058);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noise.onended = () => {
      try { noise.disconnect(); filter.disconnect(); gain.disconnect(); } catch (_) {}
    };
    noise.start(now);
  }
}

// ============================================================================
// RESPONSIVE LAYOUT & LANE MANAGEMENT
// ============================================================================
function buildLanes(preserveShapes = true) {
  const oldGuitarCount = lanes.filter(l => l.type === 'guitar').length;
  const oldMarginL = marginL;
  const oldMarginR = marginR;
  const oldUsableW = Math.max(120, oldMarginR - oldMarginL);

  const config = INSTRUMENT_CONFIGS[currentInstrument];
  const stringDefs = config.strings;
  const newGuitarCount = stringDefs.length;

  const minDim = Math.min(width, height);
  uiScale = Math.max(0.76, Math.min(1.3, minDim / 430));

  marginL = Math.round(Math.max(68, Math.min(110, width * 0.17)));
  marginR = Math.round(width - Math.max(16, Math.min(40, width * 0.04)));
  const newUsableW = Math.max(120, marginR - marginL);

  const hudRect = topHud ? topHud.getBoundingClientRect() : { bottom: 60 };
  const safeHudBottom = Math.max(54, hudRect.bottom);

  fretHeaderY = safeHudBottom + Math.round(14 * uiScale);
  playTop = fretHeaderY + Math.round(18 * uiScale);

  bottomMargin = Math.round(Math.max(12, height * 0.018));
  const availableTotalH = Math.max(240, height - playTop - bottomMargin);

  dockHeight = Math.round(Math.max(132, Math.min(215, availableTotalH * 0.31)));
  staffTop = height - dockHeight - bottomMargin;
  playBottom = staffTop - Math.round(18 * uiScale);

  const totalRows = newGuitarCount + DRUM_DEFS.length;
  const drumGapRatio = 0.35;
  const spacing = Math.max(18, (playBottom - playTop) / (totalRows - 1 + drumGapRatio));

  const rowScale = Math.min(1.2, Math.max(0.68, spacing / 38));
  uiScale = Math.min(uiScale, rowScale * 1.15);

  const previousTravelerFrac = travelers.map(t => (t.x - oldMarginL) / oldUsableW);
  lanes.length = 0;

  // 1. Guitar String Lanes
  stringDefs.forEach((def, idx) => {
    lanes.push({
      index: idx,
      type: 'guitar',
      name: def.name,
      baseFreq: def.baseFreq,
      baseStep: def.baseStep,
      color: def.color,
      glow: def.glow,
      thickness: def.thickness * uiScale,
      y: playTop + idx * spacing,
      vibAmp: 0,
      vibPhase: 0,
      lastTriggerMs: 0
    });
  });

  // 2. Drum Lanes
  const drumGap = spacing * drumGapRatio;
  DRUM_DEFS.forEach((def, idx) => {
    const laneIndex = newGuitarCount + idx;
    lanes.push({
      index: laneIndex,
      type: 'drum',
      drumId: def.id,
      name: def.label,
      staffStep: def.staffStep,
      isCrossNote: def.isCrossNote,
      color: def.color,
      fill: def.fill,
      y: playTop + drumGap + laneIndex * spacing,
      flash: 0,
      lastTriggerMs: 0
    });
  });

  travelers.length = 0;
  lanes.forEach((lane, i) => {
    const frac = previousTravelerFrac[i] !== undefined
      ? Math.max(0, Math.min(1, previousTravelerFrac[i]))
      : ((i * 0.19) % 0.9);
    travelers.push({
      laneIndex: i,
      x: marginL + frac * newUsableW
    });
  });

  shapes.forEach(s => {
    if (s.frac === undefined) {
      s.frac = Math.max(0.04, Math.min(0.96, (s.x - oldMarginL) / oldUsableW));
    }
    if (preserveShapes && oldGuitarCount > 0 && oldGuitarCount !== newGuitarCount) {
      if (s.isDrum) {
        s.laneIndex = newGuitarCount + s.drumOffset;
      } else {
        s.laneIndex = Math.min(
          newGuitarCount - 1,
          Math.round((s.laneIndex / (oldGuitarCount - 1)) * (newGuitarCount - 1))
        );
      }
    }
    s.x = marginL + s.frac * newUsableW;
    if (lanes[s.laneIndex]) {
      s.y = lanes[s.laneIndex].y;
    }
  });
}

function resizeCanvas() {
  const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;

  width = Math.round(vw);
  height = Math.round(vh);

  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  buildLanes(true);
}

window.addEventListener('resize', resizeCanvas);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resizeCanvas);
  window.visualViewport.addEventListener('scroll', resizeCanvas);
}

function seedStarterArrangement() {
  shapes.length = 0;
  const usableW = Math.max(120, marginR - marginL);
  const gCount = INSTRUMENT_CONFIGS[currentInstrument].strings.length;

  const starter = [
    { isDrum: false, idx: gCount - 1, frac: 0.13, geo: 'circle' },
    { isDrum: false, idx: Math.min(gCount - 1, 3), frac: 0.28, geo: 'triangle' },
    { isDrum: false, idx: Math.min(gCount - 1, 2), frac: 0.46, geo: 'diamond' },
    { isDrum: false, idx: Math.min(gCount - 1, 1), frac: 0.64, geo: 'circle' },
    { isDrum: false, idx: 0, frac: 0.81, geo: 'hexagon' },
    { isDrum: true, drumOffset: 2, frac: 0.13, geo: 'squircle' },
    { isDrum: true, drumOffset: 0, frac: 0.37, geo: 'hexagon' },
    { isDrum: true, drumOffset: 1, frac: 0.61, geo: 'squircle' },
    { isDrum: true, drumOffset: 0, frac: 0.85, geo: 'hexagon' }
  ];

  starter.forEach(item => {
    const laneIndex = item.isDrum ? gCount + item.drumOffset : item.idx;
    if (lanes[laneIndex]) {
      shapes.push({
        laneIndex,
        isDrum: item.isDrum,
        drumOffset: item.drumOffset || 0,
        frac: item.frac,
        x: marginL + usableW * item.frac,
        y: lanes[laneIndex].y,
        geo: item.geo,
        scale: 1,
        pulse: 0,
        cooldown: 0,
        rotation: 0
      });
    }
  });
}

function getGuitarPitchAtX(lane, x) {
  const usableW = Math.max(120, marginR - marginL);
  const norm = Math.max(0, Math.min(0.999, (x - marginL) / usableW));
  const zoneIdx = Math.floor(norm * PENTATONIC_ZONES.length);
  const zone = PENTATONIC_ZONES[zoneIdx];

  const freq = lane.baseFreq * Math.pow(2, zone.semitones / 12);
  const noteNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  const noteLabel = noteNames[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);

  return {
    freq,
    staffStep: lane.baseStep + zone.stepOffset,
    noteLabel
  };
}

function triggerLane(laneIndex, x, shapeGeo = 'circle') {
  const lane = lanes[laneIndex];
  if (!lane) return;

  // Per-lane micro-debounce (25ms) prevents audio engine flooding on rapid continuous strumming
  const nowMs = performance.now();
  if (nowMs - lane.lastTriggerMs < 25) return;
  lane.lastTriggerMs = nowMs;

  const dockRightSpawn = width - Math.max(46, Math.round(58 * uiScale));

  if (lane.type === 'guitar') {
    const pitch = getGuitarPitchAtX(lane, x);
    playGuitarNote(pitch.freq, shapeGeo);
    lane.vibAmp = (currentInstrument === 'bass' ? 14 : 11) * uiScale;
    lane.vibPhase = 0;

    sheetNotes.push({
      x: dockRightSpawn,
      type: 'guitar',
      staffStep: pitch.staffStep,
      label: pitch.noteLabel,
      color: lane.color,
      fill: lane.glow,
      alpha: 1
    });
  } else {
    playDrumSound(lane.drumId);
    lane.flash = 1;

    sheetNotes.push({
      x: dockRightSpawn,
      type: 'drum',
      staffStep: lane.staffStep,
      isCrossNote: lane.isCrossNote,
      label: lane.name,
      color: lane.color,
      fill: lane.fill,
      alpha: 1
    });
  }

  // Cap total active sheet notes & ripples so rapid strumming never slows down canvas rendering
  if (sheetNotes.length > 90) sheetNotes.shift();
  if (ripples.length > 60) ripples.shift();

  ripples.push({
    x,
    y: lane.y,
    r: 8 * uiScale,
    alpha: 0.85,
    color: lane.color
  });
}

// ============================================================================
// INSTRUMENT SWITCHING & UI EVENTS
// ============================================================================
function setInstrument(inst, playPreview = true) {
  if (!INSTRUMENT_CONFIGS[inst]) return;
  currentInstrument = inst;

  document.querySelectorAll('[data-instrument]').forEach(btn => {
    btn.classList.toggle('selected', btn.getAttribute('data-instrument') === inst);
  });

  const tagEl = document.getElementById('frontInstrumentTag');
  if (tagEl) {
    tagEl.textContent = INSTRUMENT_CONFIGS[inst].label;
  }

  buildLanes(true);

  if (playPreview) {
    ensureAudio();
    const gLanes = lanes.filter(l => l.type === 'guitar');
    gLanes.slice(0, 3).forEach((l, i) => {
      setTimeout(() => {
        playGuitarNote(l.baseFreq * 1.25, 'circle');
        l.vibAmp = 9 * uiScale;
      }, i * 65);
    });
  }
}

document.querySelectorAll('[data-instrument]').forEach(btn => {
  btn.addEventListener('click', () => {
    setInstrument(btn.getAttribute('data-instrument'), true);
  });
});

const frontScreen = document.getElementById('frontScreen');
document.getElementById('beginBtn').addEventListener('click', () => {
  ensureAudio();
  frontScreen.classList.add('hidden-screen');
  resizeCanvas();
  const gLanes = lanes.filter(l => l.type === 'guitar');
  gLanes.slice().reverse().forEach((lane, idx) => {
    setTimeout(() => {
      triggerLane(lane.index, marginL + (idx + 1) * ((marginR - marginL) / (gLanes.length + 1)), 'circle');
    }, idx * 70);
  });
});

document.getElementById('homeBtn').addEventListener('click', () => {
  frontScreen.classList.remove('hidden-screen');
});

const flowBtn = document.getElementById('flowBtn');
const flowLabel = document.getElementById('flowLabel');
const flowDot = document.getElementById('flowDot');
flowBtn.addEventListener('click', () => {
  ensureAudio();
  flowEnabled = !flowEnabled;
  flowLabel.textContent = flowEnabled ? 'Flow: On' : 'Flow: Paused';
  flowBtn.classList.toggle('active-toggle', flowEnabled);
  flowDot.classList.toggle('animate-pulse', flowEnabled);
});

document.getElementById('spawnOrbBtn').addEventListener('click', () => {
  ensureAudio();
  const orbColors = ['#CBB9FF', '#F9D8E6', '#B5EAD7', '#B2E2FA', '#FFE5D0'];
  orbs.push({
    x: marginL + 24 + Math.random() * Math.max(80, marginR - marginL - 48),
    y: playTop + 10 + Math.random() * Math.max(60, playBottom - playTop - 20),
    vx: (Math.random() > 0.5 ? 1 : -1) * (2.2 + Math.random() * 1.4),
    vy: (Math.random() > 0.5 ? 1 : -1) * (1.8 + Math.random() * 1.3),
    color: orbColors[orbs.length % orbColors.length],
    trail: []
  });
});

document.getElementById('speedSlider').addEventListener('input', e => {
  flowSpeed = parseFloat(e.target.value);
});

document.getElementById('clearBtn').addEventListener('click', () => {
  shapes.length = 0;
  orbs.length = 0;
  sheetNotes.length = 0;
});

// ============================================================================
// CANVAS POINTER INTERACTION (CONTINUOUS STRUMMING & SHAPE PLACEMENT)
// ============================================================================
canvas.addEventListener('pointerdown', e => {
  ensureAudio();
  pointerDown = true;
  pointerDragged = false;
  lastPointerY = e.clientY;
  pointerStart = { x: e.clientX, y: e.clientY };
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
});

canvas.addEventListener('pointermove', e => {
  if (!pointerDown) return;
  ensureAudio();

  const dist = Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y);
  if (dist > 8) pointerDragged = true;

  if (lastPointerY !== null && e.clientY < staffTop - 8 && e.clientY >= playTop - 16) {
    const clampedX = Math.max(marginL, Math.min(marginR, e.clientX));
    lanes.forEach(lane => {
      if (lane.type === 'guitar') {
        const crossedDown = lastPointerY < lane.y && e.clientY >= lane.y;
        const crossedUp = lastPointerY > lane.y && e.clientY <= lane.y;
        if (crossedDown || crossedUp) {
          triggerLane(lane.index, clampedX, 'circle');
        }
      }
    });
  }
  lastPointerY = e.clientY;
});

function handlePointerRelease(e) {
  if (!pointerDown) return;
  pointerDown = false;
  lastPointerY = null;

  if (pointerDragged || e.clientY >= staffTop - 8 || e.clientY < playTop - 22 || e.clientX < marginL - 12) return;

  // 1. Check if tapping an existing shape to remove it
  const hitRadius = Math.max(18, 22 * uiScale);
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < hitRadius) {
      ripples.push({ x: s.x, y: s.y, r: 12 * uiScale, alpha: 0.6, color: '#E895B8' });
      shapes.splice(i, 1);
      return;
    }
  }

  // 2. Find closest string or drum lane to place a new pastel shape
  let closest = null;
  let minDist = Infinity;
  lanes.forEach(lane => {
    const d = Math.abs(e.clientY - lane.y);
    if (d < minDist) {
      minDist = d;
      closest = lane;
    }
  });

  const snapThreshold = lanes.length > 1 ? Math.abs(lanes[1].y - lanes[0].y) * 0.65 : 28;
  if (closest && minDist <= Math.max(22, snapThreshold)) {
    const guitarShapes = ['circle', 'triangle', 'diamond', 'hexagon'];
    const drumShapes = ['squircle', 'hexagon', 'diamond'];
    const pool = closest.type === 'guitar' ? guitarShapes : drumShapes;
    const geo = pool[shapes.length % pool.length];
    const gCount = INSTRUMENT_CONFIGS[currentInstrument].strings.length;

    const clampedX = Math.max(marginL + 10, Math.min(marginR - 10, e.clientX));
    const usableW = Math.max(120, marginR - marginL);

    shapes.push({
      laneIndex: closest.index,
      isDrum: closest.type === 'drum',
      drumOffset: closest.type === 'drum' ? closest.index - gCount : 0,
      frac: (clampedX - marginL) / usableW,
      x: clampedX,
      y: closest.y,
      geo,
      scale: 1.38,
      pulse: 1,
      cooldown: 14,
      rotation: 0
    });

    triggerLane(closest.index, clampedX, geo);
  }
}

canvas.addEventListener('pointerup', handlePointerRelease);
canvas.addEventListener('pointercancel', () => {
  pointerDown = false;
  lastPointerY = null;
});

// ============================================================================
// SPATIAL PASTEL RENDERING HELPERS (ADAPTS TO LIGHT & DARK MODE)
// ============================================================================
function drawAmbientBackground() {
  const isDark = currentTheme === 'dark';
  const skyGrad = ctx.createLinearGradient(0, 0, width, height);

  if (isDark) {
    skyGrad.addColorStop(0, '#0F0C1B');
    skyGrad.addColorStop(0.38, '#17122A');
    skyGrad.addColorStop(0.72, '#1C1632');
    skyGrad.addColorStop(1, '#121D28');
  } else {
    skyGrad.addColorStop(0, '#FDF9FC');
    skyGrad.addColorStop(0.38, '#F9EBF4');
    skyGrad.addColorStop(0.72, '#EFE9FC');
    skyGrad.addColorStop(1, '#E6F6F3');
  }

  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  ambientSculptures.forEach(sc => {
    sc.x += sc.vx;
    sc.y += sc.vy;
    sc.angle += sc.vAngle;

    if (sc.x < -80) sc.x = width + 80;
    if (sc.x > width + 80) sc.x = -80;
    if (sc.y < -80) sc.y = staffTop + 40;
    if (sc.y > staffTop + 40) sc.y = -80;

    ctx.save();
    ctx.translate(sc.x, sc.y);
    ctx.rotate(sc.angle);
    ctx.globalAlpha = isDark ? sc.alpha * 0.62 : sc.alpha;

    const grad = ctx.createLinearGradient(-sc.radius, -sc.radius, sc.radius, sc.radius);
    grad.addColorStop(0, isDark ? 'rgba(255, 255, 255, 0.35)' : '#FFFFFF');
    grad.addColorStop(0.45, sc.c1);
    grad.addColorStop(1, sc.c2);
    ctx.fillStyle = grad;
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = 1.5;

    if (sc.kind === 'sphere') {
      ctx.beginPath();
      ctx.arc(0, 0, sc.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (sc.kind === 'ring') {
      ctx.lineWidth = sc.radius * 0.34;
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, sc.radius * 0.75, 0, Math.PI * 2);
      ctx.stroke();
    } else if (sc.kind === 'capsule') {
      ctx.beginPath();
      ctx.roundRect(-sc.radius * 0.9, -sc.radius * 0.45, sc.radius * 1.8, sc.radius * 0.9, sc.radius * 0.45);
      ctx.fill();
      ctx.stroke();
    } else if (sc.kind === 'arch') {
      ctx.beginPath();
      ctx.arc(0, 0, sc.radius * 0.85, Math.PI, 0, false);
      ctx.lineTo(sc.radius * 0.85, sc.radius * 0.7);
      ctx.lineTo(-sc.radius * 0.85, sc.radius * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i * 2 * Math.PI) / 3 - Math.PI / 2;
        const px = Math.cos(a) * sc.radius;
        const py = Math.sin(a) * sc.radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  });
}

function drawTriggerShape(s, lane) {
  const isDark = currentTheme === 'dark';
  const r = 11.5 * uiScale * s.scale;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.rotation);

  ctx.shadowColor = lane.color;
  ctx.shadowBlur = (9 + s.pulse * 15) * uiScale;

  const fillGrad = ctx.createLinearGradient(-r, -r, r, r);
  fillGrad.addColorStop(0, isDark ? 'rgba(52, 44, 78, 0.94)' : 'rgba(255, 255, 255, 0.96)');
  fillGrad.addColorStop(1, lane.glow || lane.fill || '#FAD8E6');

  ctx.fillStyle = fillGrad;
  ctx.strokeStyle = lane.color;
  ctx.lineWidth = 2 * uiScale;

  ctx.beginPath();
  if (s.geo === 'circle') {
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  } else if (s.geo === 'squircle') {
    ctx.roundRect(-r * 0.92, -r * 0.92, r * 1.84, r * 1.84, r * 0.48);
  } else if (s.geo === 'diamond') {
    ctx.rotate(Math.PI / 4);
    ctx.roundRect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7, r * 0.35);
  } else if (s.geo === 'triangle') {
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
      const px = Math.cos(a) * (r * 1.18);
      const py = Math.sin(a) * (r * 1.18);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (s.geo === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const a = (i * 2 * Math.PI) / 6;
      const px = Math.cos(a) * (r * 1.08);
      const py = Math.sin(a) * (r * 1.08);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = lane.color;
  ctx.beginPath();
  ctx.arc(0, 0, 2.5 * uiScale, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ============================================================================
// LIVE SCROLLING SHEET MUSIC DOCK
// ============================================================================
function drawSheetMusicDock() {
  const isDark = currentTheme === 'dark';
  const dockPadX = Math.round(Math.max(10, width * 0.025));
  const dockX = dockPadX;
  const dockY = staffTop;
  const dockW = width - dockPadX * 2;
  const dockH = dockHeight;
  const cornerRadius = Math.round(24 * uiScale);

  ctx.save();

  // Frosted Spatial Glass Card for Sheet Music
  ctx.fillStyle = isDark ? 'rgba(28, 23, 46, 0.78)' : 'rgba(255, 255, 255, 0.76)';
  ctx.strokeStyle = isDark ? 'rgba(216, 198, 255, 0.24)' : 'rgba(255, 255, 255, 0.96)';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(61, 53, 75, 0.09)';
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.roundRect(dockX, dockY, dockW, dockH, cornerRadius);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Clip everything strictly inside the rounded dock card
  ctx.beginPath();
  ctx.roundRect(dockX, dockY, dockW, dockH, cornerRadius);
  ctx.clip();

  const headerH = Math.round(24 * uiScale);
  const footerH = Math.round(18 * uiScale);
  const headerFontSize = Math.max(9, Math.round(10 * uiScale));

  // Top Header Bar inside the Dock
  ctx.fillStyle = isDark ? '#A99EC0' : '#766B8A';
  ctx.font = `700 ${headerFontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('LIVE SHEET MUSIC  •  ' + currentInstrument.toUpperCase(), dockX + 18, dockY + headerH * 0.62);

  // Right-aligned "MADE BY SOU." signature quotation badge inside the score dock
  ctx.textAlign = 'right';
  ctx.fillStyle = isDark ? '#CFC5E6' : '#5C5072';
  ctx.fillText('"MADE BY SOU."', dockX + dockW - 18, dockY + headerH * 0.62);

  const minStep = -7;
  const maxStep = 9;
  const totalSteps = maxStep - minStep;
  const usableStaffH = Math.max(48, dockH - headerH - footerH - 12 * uiScale);
  const stepSize = usableStaffH / totalSteps;
  const lineSpacing = stepSize * 2;

  const staffTopY = dockY + headerH + 6 * uiScale;
  const bottomLineY = staffTopY + maxStep * stepSize;

  // Draw 5 Staff Lines
  ctx.strokeStyle = isDark ? 'rgba(224, 212, 255, 0.18)' : 'rgba(61, 53, 75, 0.2)';
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 5; i++) {
    const ly = bottomLineY - i * lineSpacing;
    ctx.beginPath();
    ctx.moveTo(dockX + 18, ly);
    ctx.lineTo(dockX + dockW - 18, ly);
    ctx.stroke();
  }

  // Draw Clef (Treble 𝄞 or Bass 𝄢)
  const instConfig = INSTRUMENT_CONFIGS[currentInstrument];
  const clefFontSize = Math.round(lineSpacing * 3.5);
  ctx.fillStyle = isDark ? '#F4EFFC' : '#322A42';
  ctx.font = `${clefFontSize}px serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(instConfig.clef, dockX + 24, bottomLineY - lineSpacing * instConfig.clefOffset);

  const fadeOutX = dockX + 24 + clefFontSize * 1.15;
  const strokeInk = isDark ? '#EAE2F8' : '#322A42';

  // Update & Draw Scrolling Notes
  for (let i = sheetNotes.length - 1; i >= 0; i--) {
    const n = sheetNotes[i];
    n.x -= 1.45 * (flowSpeed / 2.4);

    if (n.x < fadeOutX) {
      n.alpha -= 0.06;
    }
    if (n.alpha <= 0) {
      sheetNotes.splice(i, 1);
      continue;
    }

    const clampedStep = Math.max(minStep, Math.min(maxStep, n.staffStep));
    const ny = bottomLineY - clampedStep * stepSize;
    const noteRx = Math.max(4.2, stepSize * 1.15);
    const noteRy = Math.max(3.2, stepSize * 0.85);
    const stemLen = Math.max(14, lineSpacing * 2.1);

    ctx.save();
    ctx.globalAlpha = Math.max(0, n.alpha);
    ctx.strokeStyle = strokeInk;
    ctx.lineWidth = 1.3;

    // Ledger lines
    if (clampedStep <= -2) {
      for (let s = -2; s >= clampedStep; s -= 2) {
        const ly = bottomLineY - s * stepSize;
        ctx.beginPath();
        ctx.moveTo(n.x - noteRx * 1.6, ly);
        ctx.lineTo(n.x + noteRx * 1.6, ly);
        ctx.stroke();
      }
    } else if (clampedStep >= 10) {
      for (let s = 10; s <= clampedStep; s += 2) {
        const ly = bottomLineY - s * stepSize;
        ctx.beginPath();
        ctx.moveTo(n.x - noteRx * 1.6, ly);
        ctx.lineTo(n.x + noteRx * 1.6, ly);
        ctx.stroke();
      }
    }

    // Note Stem
    const stemUp = clampedStep < 4;
    ctx.strokeStyle = strokeInk;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (stemUp) {
      ctx.moveTo(n.x + noteRx * 0.88, ny);
      ctx.lineTo(n.x + noteRx * 0.88, ny - stemLen);
    } else {
      ctx.moveTo(n.x - noteRx * 0.88, ny);
      ctx.lineTo(n.x - noteRx * 0.88, ny + stemLen);
    }
    ctx.stroke();

    // Pastel Notehead
    if (n.isCrossNote) {
      const r = noteRy * 1.05;
      ctx.strokeStyle = n.color;
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(n.x - r, ny - r);
      ctx.lineTo(n.x + r, ny + r);
      ctx.moveTo(n.x + r, ny - r);
      ctx.lineTo(n.x - r, ny + r);
      ctx.stroke();
    } else {
      ctx.fillStyle = n.color;
      ctx.strokeStyle = strokeInk;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.ellipse(n.x, ny, noteRx, noteRy, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Note pitch / drum label pill inside the bottom footer of the dock
    const labelFontSize = Math.max(8.5, Math.round(9.2 * uiScale));
    ctx.font = `600 ${labelFontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isDark ? '#CFC5E6' : '#5C5072';
    ctx.fillText(n.label, n.x, dockY + dockH - footerH * 0.55);

    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// MAIN ANIMATION LOOP
// ============================================================================
function animate() {
  ctx.clearRect(0, 0, width, height);
  const isDark = currentTheme === 'dark';

  // 1. Draw Serene Pastel Sky & Floating 3D-like Sculptures
  drawAmbientBackground();

  const usableW = Math.max(120, marginR - marginL);
  const guitarLanes = lanes.filter(l => l.type === 'guitar');
  const lastGuitarY = guitarLanes.length ? guitarLanes[guitarLanes.length - 1].y : 240;

  // 2. Draw Subtle Harmonic Fret-Zone Guides across the Guitar Strings
  ctx.save();
  const zoneFontSize = Math.max(8.5, Math.round(9.5 * uiScale));
  for (let z = 0; z < PENTATONIC_ZONES.length; z++) {
    const zx = marginL + (usableW * z) / PENTATONIC_ZONES.length;
    if (z > 0) {
      ctx.strokeStyle = isDark ? 'rgba(216, 198, 255, 0.11)' : 'rgba(61, 53, 75, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(zx, fretHeaderY - 4);
      ctx.lineTo(zx, lastGuitarY + 12 * uiScale);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = isDark ? 'rgba(224, 212, 255, 0.54)' : 'rgba(61, 53, 75, 0.46)';
    ctx.font = `600 ${zoneFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(PENTATONIC_ZONES[z].name, zx + 5, fretHeaderY);
  }
  ctx.restore();

  // 3. Render Guitar Strings & Drum Tracks
  const pillW = Math.max(46, Math.round(marginL - 18));
  const pillH = Math.max(17, Math.round(20 * uiScale));
  const pillX = Math.round((marginL - pillW) * 0.5);
  const labelFontSize = Math.max(8.5, Math.round(10 * uiScale));

  lanes.forEach(lane => {
    // Left pill label scaled to device width
    ctx.save();
    ctx.fillStyle = isDark ? 'rgba(42, 35, 66, 0.82)' : 'rgba(255, 255, 255, 0.78)';
    ctx.strokeStyle = isDark ? 'rgba(216, 198, 255, 0.25)' : 'rgba(255, 255, 255, 0.96)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(pillX, lane.y - pillH / 2, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? '#F4EFFC' : '#322A42';
    ctx.font = `700 ${labelFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lane.name, pillX + pillW / 2, lane.y);
    ctx.restore();

    if (lane.type === 'guitar') {
      ctx.save();
      const idleStringColor = isDark ? 'rgba(226, 214, 255, 0.26)' : 'rgba(61, 53, 75, 0.25)';
      ctx.strokeStyle = lane.vibAmp > 0.35 ? lane.color : idleStringColor;
      ctx.lineWidth = lane.thickness;
      ctx.lineCap = 'round';

      if (lane.vibAmp > 0.35) {
        ctx.shadowColor = lane.color;
        ctx.shadowBlur = 11 * uiScale;
      }

      ctx.beginPath();
      ctx.moveTo(marginL, lane.y);

      if (lane.vibAmp > 0.1) {
        const segments = 48;
        for (let i = 1; i <= segments; i++) {
          const t = i / segments;
          const px = marginL + t * usableW;
          const env = Math.sin(t * Math.PI);
          const wave = Math.sin(t * Math.PI * 5 + lane.vibPhase) * lane.vibAmp * env;
          ctx.lineTo(px, lane.y + wave);
        }
        lane.vibPhase += 0.62;
        lane.vibAmp *= 0.91;
      } else {
        ctx.lineTo(marginR, lane.y);
      }
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.save();
      const idleDrumColor = isDark ? 'rgba(226, 214, 255, 0.18)' : 'rgba(61, 53, 75, 0.16)';
      ctx.strokeStyle = lane.flash > 0.05 ? lane.color : idleDrumColor;
      ctx.lineWidth = (1.8 + lane.flash * 2.2) * uiScale;
      ctx.setLineDash([6 * uiScale, 8 * uiScale]);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(marginL, lane.y);
      ctx.lineTo(marginR, lane.y);
      ctx.stroke();
      ctx.restore();
      lane.flash *= 0.88;
    }
  });

  // 4. Update & Draw Lane Kinetic Travelers
  const stepSpeed = flowSpeed * (usableW / 800 + 0.45);
  travelers.forEach(tr => {
    const lane = lanes[tr.laneIndex];
    if (!lane) return;

    const prevX = tr.x;
    if (flowEnabled) {
      tr.x += stepSpeed;
      if (tr.x > marginR) {
        tr.x = marginL;
      }

      shapes.forEach(s => {
        if (s.laneIndex === tr.laneIndex && s.cooldown <= 0) {
          if (prevX < s.x && tr.x >= s.x) {
            s.scale = 1.45;
            s.pulse = 1;
            s.cooldown = 15;
            triggerLane(s.laneIndex, s.x, s.geo);
          }
        }
      });
    }

    ctx.save();
    ctx.fillStyle = isDark ? '#231D38' : '#FFFFFF';
    ctx.strokeStyle = lane.color;
    ctx.lineWidth = 2.2 * uiScale;
    ctx.shadowColor = lane.color;
    ctx.shadowBlur = 10 * uiScale;
    ctx.beginPath();
    ctx.arc(tr.x, lane.y, 4.8 * uiScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  // 5. Update & Draw Free-Bouncing Pastel Orbs
  orbs.forEach(orb => {
    if (flowEnabled) {
      orb.x += orb.vx * (flowSpeed / 2.4) * uiScale;
      orb.y += orb.vy * (flowSpeed / 2.4) * uiScale;

      if (orb.x < marginL + 8) { orb.x = marginL + 8; orb.vx *= -1; }
      if (orb.x > marginR - 8) { orb.x = marginR - 8; orb.vx *= -1; }
      if (orb.y < playTop - 6) { orb.y = playTop - 6; orb.vy *= -1; }
      if (orb.y > playBottom + 6) { orb.y = playBottom + 6; orb.vy *= -1; }

      orb.trail.push({ x: orb.x, y: orb.y });
      if (orb.trail.length > 10) orb.trail.shift();

      shapes.forEach(s => {
        if (s.cooldown <= 0 && Math.hypot(orb.x - s.x, orb.y - s.y) < 19 * uiScale) {
          s.scale = 1.48;
          s.pulse = 1;
          s.cooldown = 16;
          triggerLane(s.laneIndex, s.x, s.geo);
        }
      });
    }

    orb.trail.forEach((pt, idx) => {
      ctx.save();
      ctx.globalAlpha = (idx / orb.trail.length) * 0.35;
      ctx.fillStyle = orb.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, (2.6 + idx * 0.3) * uiScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();
    ctx.fillStyle = isDark ? '#231D38' : '#FFFFFF';
    ctx.strokeStyle = orb.color;
    ctx.lineWidth = 2.6 * uiScale;
    ctx.shadowColor = orb.color;
    ctx.shadowBlur = 12 * uiScale;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, 6.8 * uiScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  // 6. Draw Placed Geometric Shapes
  shapes.forEach(s => {
    if (s.cooldown > 0) s.cooldown--;
    s.scale += (1 - s.scale) * 0.16;
    s.pulse *= 0.9;
    s.rotation += 0.004;
    const lane = lanes[s.laneIndex];
    if (lane) {
      s.y = lane.y;
      drawTriggerShape(s, lane);
    }
  });

  // 7. Draw Expanding Bloom Ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.r += 1.5 * uiScale;
    rp.alpha *= 0.91;
    if (rp.alpha < 0.03) {
      ripples.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.strokeStyle = rp.color;
    ctx.globalAlpha = rp.alpha;
    ctx.lineWidth = 1.8 * uiScale;
    ctx.beginPath();
    ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 8. Draw Bottom Live Sheet Music Dock
  drawSheetMusicDock();

  requestAnimationFrame(animate);
}

// Boot Application
window.addEventListener('load', () => {
  resizeCanvas();
  initAmbientSculptures();
  seedStarterArrangement();
  requestAnimationFrame(animate);
});

