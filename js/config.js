export const SAVE_KEY = 'flowIdleSave_v1';

export const COLOR_POOL = [
  '#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#8338ec', '#ff7f50',
  '#8ac926', '#ff595e', '#1982c4', '#6a4c93', '#f15bb5', '#00bbf9'
];

export const PACKS = [
  { id: 'starter', name: 'Starter Pack', size: 5, targetPairs: 5, unlockEnergy: 0 },
  { id: 'advanced', name: 'Advanced Pack', size: 7, targetPairs: 8, unlockEnergy: 200 },
  { id: 'expert', name: 'Expert Pack', size: 10, targetPairs: 12, unlockEnergy: 1200 },
  { id: 'master', name: 'Master Pack', size: 14, targetPairs: 18, unlockEnergy: 8000 },
  { id: 'endless', name: 'Endless Mode', size: 8, targetPairs: 10, unlockEnergy: 3000, endless: true }
];

export const UPGRADE_DEFS = {
  autoSolver: {
    name: 'Auto Solver Speed',
    description: 'Automatically fills puzzle tiles over time.',
    baseCost: 25,
    growth: 1.7,
    effect: (lvl) => lvl * 0.35
  },
  hintGen: {
    name: 'Hint Generator',
    description: 'Generates passive hints periodically.',
    baseCost: 35,
    growth: 1.75,
    effect: (lvl) => Math.max(0, lvl)
  },
  energyMult: {
    name: 'Energy Multiplier',
    description: 'Boosts energy gain per puzzle.',
    baseCost: 60,
    growth: 1.85,
    effect: (lvl) => 1 + lvl * 0.25
  },
  puzzleGen: {
    name: 'Puzzle Generator',
    description: 'Unlocks richer procedural infinite levels.',
    baseCost: 120,
    growth: 1.95,
    effect: (lvl) => lvl
  },
  offline: {
    name: 'Offline Earnings',
    description: 'Gain energy while away.',
    baseCost: 90,
    growth: 1.8,
    effect: (lvl) => lvl * 0.12
  }
};

export const PRESTIGE_BASE = 10000;
