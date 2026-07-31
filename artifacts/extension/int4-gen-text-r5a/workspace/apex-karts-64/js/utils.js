// Deterministic seeded RNG (mulberry32)
function createRNG(seed) {
  let s = seed | 0;
  return function() {
    s |= 0;
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Linear interpolation
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Clamp value
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// Format seconds to mm:ss.ms
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins + ':' + secs.toFixed(2).padStart(5, '0');
}

// Smooth step
function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

// Color palette - cheerful N64-style
const PALETTE = {
  grass: 0x4a8c3f,
  grassLight: 0x5da84e,
  road: 0x555555,
  roadLine: 0xeeeeee,
  curb: 0xff3333,
  curbAlt: 0xffffff,
  sky: 0x87CEEB,
  water: 0x3388cc,
  tree: 0x2d6b20,
  treeTrunk: 0x8B4513,
  flower: [0xff6699, 0xffcc00, 0xff6633, 0xcc33ff, 0xff4444],
  startLine: 0xffffff,
  finishLine: 0x333333
};