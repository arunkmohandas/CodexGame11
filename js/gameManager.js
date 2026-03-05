import { PACKS, PRESTIGE_BASE } from './config.js';
import { SaveSystem } from './saveSystem.js';
import { AudioManager } from './audioManager.js';
import { CurrencySystem } from './currencySystem.js';
import { UpgradeSystem } from './upgradeSystem.js';
import { PuzzleGenerator } from './puzzleGenerator.js';
import { GridSystem } from './gridSystem.js';
import { PathDrawingSystem } from './pathDrawingSystem.js';
import { UIManager } from './uiManager.js';

const defaultState = {
  energy: 0,
  upgrades: { autoSolver: 0, hintGen: 0, energyMult: 0, puzzleGen: 0, offline: 0 },
  progress: {},
  currentPack: 'starter',
  prestige: { shards: 0, count: 0, multiplier: 1 },
  settings: { colorblind: false, sound: true },
  stats: { puzzlesSolved: 0, totalEnergy: 0, bestTime: null, upgradesPurchased: 0 },
  session: { moves: 0, timeLeft: 0, elapsed: 0, mistakes: 0 },
  lastSave: Date.now()
};

export class GameManager {
  constructor() {
    this.state = SaveSystem.load(defaultState);
    this.audio = new AudioManager();
    this.audio.setEnabled(this.state.settings.sound);
    this.currency = new CurrencySystem(this.state);
    this.upgrades = new UpgradeSystem(this.state, this.currency);
    this.grid = new GridSystem(document.getElementById('gridBoard'));
    this.ui = new UIManager(this);
    this.currentPuzzle = null;
    this.pathing = null;
    this.dragging = null;
    this.autoProgress = 0;
    this.hintProgress = 0;
    this.bindGridEvents();
    this.applyOfflineProgress();
    this.refreshUI();
    this.loop();
  }

  bindGridEvents() {
    const board = document.getElementById('gridBoard');
    board.addEventListener('pointerdown', (e) => {
      const cell = e.target.closest('.grid-cell');
      if (!cell || !this.pathing) return;
      const x = Number(cell.dataset.x); const y = Number(cell.dataset.y);
      const color = this.currentPuzzle.solution[y][x];
      if (!this.currentPuzzle.endpoints[color]?.some((p) => p.x === x && p.y === y)) return;
      this.dragging = color;
      this.pathing.startPath(color, { x, y });
      this.renderPuzzle();
    });
    board.addEventListener('pointerenter', (e) => {
      if (!this.dragging) return;
      const cell = e.target.closest('.grid-cell');
      if (!cell) return;
      const x = Number(cell.dataset.x); const y = Number(cell.dataset.y);
      if (this.pathing.step(this.dragging, { x, y })) {
        this.state.session.moves += 1;
        if (this.currentPuzzle.solution[y][x] !== this.dragging) this.state.session.mistakes += 1;
        this.audio.play('draw');
        this.renderPuzzle();
        this.checkComplete();
      }
    }, true);
    window.addEventListener('pointerup', () => { this.dragging = null; });
  }

  startNewRun() {
    this.startPack('starter');
  }

  continueGame() {
    if (!this.currentPuzzle) this.startPack(this.state.currentPack || 'starter');
    this.ui.showScreen('gameScreen');
  }

  isPackUnlocked(packId) {
    const pack = PACKS.find((p) => p.id === packId);
    return this.state.energy >= pack.unlockEnergy || pack.unlockEnergy === 0;
  }

  startPack(packId) {
    this.state.currentPack = packId;
    const pack = PACKS.find((p) => p.id === packId);
    const seed = Date.now() + (this.state.progress[packId]?.completed || 0) * 77;
    const bonusPairs = Math.floor(this.state.upgrades.puzzleGen / 2);
    this.currentPuzzle = PuzzleGenerator.generate(pack.size, pack.targetPairs + bonusPairs, seed);
    this.pathing = new PathDrawingSystem(this.currentPuzzle);
    this.state.session = { moves: 0, timeLeft: this.currentPuzzle.timeLimit, elapsed: 0, mistakes: 0 };
    this.grid.build(this.currentPuzzle.size);
    this.renderPuzzle();
    this.ui.showScreen('gameScreen');
  }

  renderPuzzle() {
    const { colorMap, endpoints } = this.currentPuzzle;
    this.grid.clearPaint();
    Object.entries(endpoints).forEach(([colorId, points]) => {
      points.forEach(({ x, y }) => this.grid.paintCell(x, y, colorMap[colorId], true));
    });
    Object.entries(this.pathing.paths).forEach(([colorId, cells]) => {
      cells.forEach(({ x, y }) => this.grid.paintCell(x, y, colorMap[colorId], false));
    });
    this.ui.renderHUD();
  }

  undo() {
    if (this.pathing?.undo()) this.renderPuzzle();
  }

  restartPuzzle() {
    if (!this.pathing) return;
    this.pathing.reset();
    this.state.session.moves = 0;
    this.state.session.timeLeft = this.currentPuzzle.timeLimit;
    this.state.session.elapsed = 0;
    this.renderPuzzle();
  }

  useHint(manual = false) {
    if (!this.currentPuzzle) return;
    const mismatch = [];
    for (let y = 0; y < this.currentPuzzle.size; y += 1) {
      for (let x = 0; x < this.currentPuzzle.size; x += 1) {
        const should = this.currentPuzzle.solution[y][x];
        if (this.pathing.occupancy[y][x] !== should) mismatch.push({ x, y, color: should });
      }
    }
    if (!mismatch.length) return;
    const pick = mismatch[Math.floor(Math.random() * mismatch.length)];
    this.grid.hintCell(pick.x, pick.y);
    if (manual) {
      this.pathing.pushHistory();
      this.pathing.occupancy[pick.y][pick.x] = pick.color;
      if (!this.pathing.paths[pick.color].some((p) => p.x === pick.x && p.y === pick.y)) this.pathing.paths[pick.color].push({ x: pick.x, y: pick.y });
      this.state.session.mistakes += 1;
      this.renderPuzzle();
      this.checkComplete();
    }
  }

  checkComplete() {
    if (!this.pathing.isSolved()) return;
    this.audio.play('complete');
    const pack = this.state.currentPack;
    const base = this.currentPuzzle.size * Object.keys(this.currentPuzzle.endpoints).length;
    const reward = this.currency.gainFromPuzzle(base);
    const stars = this.calculateStars();
    const entry = this.state.progress[pack] || { completed: 0, stars: 0 };
    entry.completed += 1;
    entry.stars += stars;
    this.state.progress[pack] = entry;
    this.state.stats.puzzlesSolved += 1;
    this.state.stats.bestTime = this.state.stats.bestTime === null ? this.state.session.elapsed : Math.min(this.state.stats.bestTime, this.state.session.elapsed);
    this.ui.renderStats();
    this.refreshUI();
    this.ui.showComplete(reward, stars);
  }

  calculateStars() {
    const perfect = this.state.session.mistakes === 0 && this.state.session.moves <= this.currentPuzzle.movesLimit;
    if (perfect) return 3;
    if (this.state.session.mistakes <= 3) return 2;
    return 1;
  }

  nextPuzzle() {
    this.startPack(this.state.currentPack);
  }

  buyUpgrade(id) {
    if (this.upgrades.buy(id)) {
      this.audio.play('upgrade');
      this.refreshUI();
    }
  }

  energyPerSecond() {
    return this.currency.passivePerSecond;
  }

  previewPrestigeGain() {
    return Math.floor(this.state.energy / PRESTIGE_BASE);
  }

  prestige() {
    const gain = this.previewPrestigeGain();
    if (gain < 1) return;
    this.state.prestige.shards += gain;
    this.state.prestige.count += 1;
    this.state.prestige.multiplier = 1 + this.state.prestige.shards * 0.08;
    this.state.energy = 0;
    this.state.progress = {};
    this.upgrades.resetForPrestige();
    this.audio.play('prestige');
    this.refreshUI();
  }

  setColorblind(enabled) {
    this.state.settings.colorblind = enabled;
    document.body.classList.toggle('colorblind', enabled);
  }

  refreshUI() {
    this.ui.renderHUD();
    this.ui.renderUpgrades();
    this.ui.renderLevelSelect();
    this.ui.renderStats();
    this.ui.updatePrestige();
  }

  applyOfflineProgress() {
    const now = Date.now();
    const deltaSec = Math.max(0, (now - (this.state.lastSave || now)) / 1000);
    const maxOffline = 60 * 60 * 8;
    const applied = Math.min(deltaSec, maxOffline);
    if (applied > 3) this.currency.add(applied * this.energyPerSecond());
    this.state.lastSave = now;
  }

  loop() {
    let prev = performance.now();
    const tick = (now) => {
      const dt = (now - prev) / 1000;
      prev = now;
      const passive = this.energyPerSecond();
      if (passive > 0) this.currency.add(passive * dt);

      if (this.currentPuzzle) {
        this.state.session.timeLeft -= dt;
        this.state.session.elapsed += dt;
        if (this.state.session.timeLeft <= 0) this.restartPuzzle();

        this.autoProgress += dt * this.state.upgrades.autoSolver * 0.35;
        while (this.autoProgress >= 1) {
          this.autoProgress -= 1;
          this.useHint(true);
        }

        if (this.state.upgrades.hintGen > 0) {
          this.hintProgress += dt;
          const every = Math.max(4, 18 - this.state.upgrades.hintGen * 1.2);
          if (this.hintProgress >= every) {
            this.hintProgress = 0;
            this.useHint(false);
          }
        }
      }

      this.ui.renderHUD();
      if (Math.random() < 0.02) this.save();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setInterval(() => this.save(), 5000);
  }

  save() {
    this.state.lastSave = Date.now();
    this.state.settings.sound = this.audio.enabled;
    SaveSystem.save(this.state);
  }
}
