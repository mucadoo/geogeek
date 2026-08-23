// Tiny synthesized sound effects via the Web Audio API — no audio asset
// files to source, license, or ship. Each call briefly reuses a lazily
// created, shared AudioContext (browsers require a prior user gesture to
// start one, which every call site here already has — it fires from a
// click/keypress guess submission).

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!ctx) ctx = new AudioContextClass();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

interface Tone {
  freq: number;
  start: number; // seconds from now
  duration: number; // seconds
  type?: OscillatorType;
  gain?: number;
}

function playTones(tones: Tone[]) {
  const audioCtx = getContext();
  if (!audioCtx) return;

  tones.forEach(({ freq, start, duration, type = 'sine', gain = 0.15 }) => {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;

    const t0 = audioCtx.currentTime + start;
    gainNode.gain.setValueAtTime(0, t0);
    gainNode.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(gainNode).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  });
}

export function playCorrect() {
  playTones([{ freq: 523.25, start: 0, duration: 0.12 }, { freq: 783.99, start: 0.08, duration: 0.18 }]);
}

export function playWrong() {
  playTones([{ freq: 196, start: 0, duration: 0.22, type: 'sawtooth', gain: 0.1 }]);
}

export function playStreak() {
  playTones([
    { freq: 659.25, start: 0, duration: 0.1 },
    { freq: 783.99, start: 0.07, duration: 0.1 },
    { freq: 1046.5, start: 0.14, duration: 0.2 },
  ]);
}

export function playFinish() {
  playTones([
    { freq: 523.25, start: 0, duration: 0.14 },
    { freq: 659.25, start: 0.12, duration: 0.14 },
    { freq: 783.99, start: 0.24, duration: 0.14 },
    { freq: 1046.5, start: 0.36, duration: 0.3 },
  ]);
}
