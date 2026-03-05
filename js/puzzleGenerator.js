import { COLOR_POOL } from './config.js';

function snakeCells(size) {
  const cells = [];
  for (let y = 0; y < size; y += 1) {
    if (y % 2 === 0) {
      for (let x = 0; x < size; x += 1) cells.push({ x, y });
    } else {
      for (let x = size - 1; x >= 0; x -= 1) cells.push({ x, y });
    }
  }
  return cells;
}

export class PuzzleGenerator {
  static generate(size, pairTarget, seed = Date.now()) {
    const rand = mulberry32(seed);
    const all = snakeCells(size);
    const minPairs = Math.max(3, Math.floor(size * 0.8));
    const pairs = Math.min(pairTarget, Math.floor((size * size) / 2), minPairs + Math.floor(rand() * 3));

    const remaining = size * size;
    const lengths = [];
    let left = remaining;
    for (let i = 0; i < pairs; i += 1) {
      const remainPairs = pairs - i;
      const minNeeded = (remainPairs - 1) * 2;
      const maxLen = Math.min(8 + Math.floor(size / 2), left - minNeeded);
      const minLen = 2;
      const len = i === pairs - 1 ? left : Math.max(minLen, Math.floor(rand() * (maxLen - minLen + 1)) + minLen);
      lengths.push(len);
      left -= len;
    }
    while (left > 0) {
      const idx = Math.floor(rand() * lengths.length);
      lengths[idx] += 1;
      left -= 1;
    }

    const colorIds = lengths.map((_, i) => `c${i}`);
    const colorMap = Object.fromEntries(colorIds.map((id, i) => [id, COLOR_POOL[i % COLOR_POOL.length]]));

    let pointer = 0;
    const solution = Array.from({ length: size }, () => Array(size).fill(null));
    const endpoints = {};
    const segments = {};

    lengths.forEach((len, idx) => {
      const id = colorIds[idx];
      const seg = all.slice(pointer, pointer + len);
      pointer += len;
      segments[id] = seg;
      endpoints[id] = [seg[0], seg[seg.length - 1]];
      seg.forEach(({ x, y }) => {
        solution[y][x] = id;
      });
    });

    return { size, colorMap, endpoints, solution, segments, movesLimit: size * size * 1.8, timeLimit: 90 + size * 8 };
  }
}

function mulberry32(a) {
  return function rng() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
