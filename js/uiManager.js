import { PACKS, UPGRADE_DEFS } from './config.js';

export class UIManager {
  constructor(game) {
    this.game = game;
    this.screens = [...document.querySelectorAll('.screen')];
    this.energyEl = document.getElementById('energyValue');
    this.epsEl = document.getElementById('epsValue');
    this.levelInfo = document.getElementById('levelInfo');
    this.movesInfo = document.getElementById('movesInfo');
    this.timerInfo = document.getElementById('timerInfo');
    this.upgradeWrap = document.getElementById('upgradeCards');
    this.levelSelect = document.getElementById('levelList');
    this.statsBox = document.getElementById('statsContent');
    this.achBox = document.getElementById('achievementList');
    this.bindEvents();
  }

  bindEvents() {
    document.querySelectorAll('[data-screen]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.game.audio.play('click');
        this.showScreen(btn.dataset.screen);
      });
    });
    document.getElementById('startGameBtn').addEventListener('click', () => this.game.startNewRun());
    document.getElementById('continueBtn').addEventListener('click', () => this.game.continueGame());
    document.getElementById('undoBtn').addEventListener('click', () => this.game.undo());
    document.getElementById('restartBtn').addEventListener('click', () => this.game.restartPuzzle());
    document.getElementById('hintBtn').addEventListener('click', () => this.game.useHint(true));
    document.getElementById('nextLevelBtn').addEventListener('click', () => this.game.nextPuzzle());
    document.getElementById('replayBtn').addEventListener('click', () => this.game.restartPuzzle());
    document.getElementById('prestigeBtn').addEventListener('click', () => this.game.prestige());
    document.getElementById('colorblindToggle').addEventListener('change', (e) => this.game.setColorblind(e.target.checked));
    document.getElementById('soundToggle').addEventListener('change', (e) => this.game.audio.setEnabled(e.target.checked));
  }

  showScreen(id) {
    this.screens.forEach((s) => s.classList.toggle('active', s.id === id));
  }

  renderHUD() {
    const { state } = this.game;
    this.energyEl.textContent = state.energy.toFixed(1);
    this.epsEl.textContent = this.game.energyPerSecond().toFixed(2);
    const p = this.game.currentPuzzle;
    if (p) {
      this.levelInfo.textContent = `${state.currentPack.toUpperCase()} ${p.size}x${p.size}`;
      this.movesInfo.textContent = `${Math.floor(state.session.moves)}/${Math.floor(p.movesLimit)}`;
      this.timerInfo.textContent = `${Math.max(0, Math.ceil(state.session.timeLeft))}s`;
    }
  }

  renderUpgrades() {
    this.upgradeWrap.innerHTML = '';
    Object.entries(UPGRADE_DEFS).forEach(([id, def]) => {
      const lvl = this.game.state.upgrades[id];
      const cost = this.game.upgrades.cost(id);
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `<h4>${def.name}</h4><p>${def.description}</p>
        <div class="meta">Level ${lvl} · Cost ${cost}</div>
        <div class="bar"><span style="width:${Math.min(100, lvl * 12)}%"></span></div>
        <button ${this.game.state.energy < cost ? 'disabled' : ''}>Upgrade</button>`;
      card.querySelector('button').addEventListener('click', () => this.game.buyUpgrade(id));
      this.upgradeWrap.appendChild(card);
    });
  }

  renderLevelSelect() {
    this.levelSelect.innerHTML = '';
    PACKS.forEach((pack) => {
      const done = this.game.state.progress[pack.id]?.completed ?? 0;
      const unlocked = this.game.isPackUnlocked(pack.id);
      const btn = document.createElement('button');
      btn.className = 'pack-btn';
      btn.disabled = !unlocked;
      btn.innerHTML = `<strong>${pack.name}</strong><span>${pack.size}x${pack.size}</span><small>Stars: ${this.game.state.progress[pack.id]?.stars || 0}</small>`;
      btn.addEventListener('click', () => this.game.startPack(pack.id));
      if (done) btn.classList.add('done');
      this.levelSelect.appendChild(btn);
    });
  }

  renderStats() {
    const s = this.game.state.stats;
    this.statsBox.innerHTML = `<p>Puzzles solved: ${s.puzzlesSolved}</p>
    <p>Total energy: ${Math.round(s.totalEnergy)}</p>
    <p>Best time: ${s.bestTime ? `${s.bestTime.toFixed(1)}s` : 'N/A'}</p>
    <p>Prestiges: ${this.game.state.prestige.count}</p>`;

    const achievements = [
      ['First Flow', s.puzzlesSolved >= 1],
      ['Energy Hoarder', s.totalEnergy >= 1000],
      ['Pipe Master', s.puzzlesSolved >= 20],
      ['Ascended', this.game.state.prestige.count >= 1]
    ];
    this.achBox.innerHTML = achievements.map(([name, ok]) => `<li class="${ok ? 'unlocked' : ''}">${ok ? '✅' : '⬜'} ${name}</li>`).join('');
  }

  showComplete(reward, stars) {
    document.getElementById('completeReward').textContent = reward;
    document.getElementById('completeStars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    this.showScreen('completeScreen');
  }

  updatePrestige() {
    const gain = this.game.previewPrestigeGain();
    document.getElementById('prestigeInfo').textContent = `Reset for +${gain} shards. Permanent multiplier: x${this.game.state.prestige.multiplier.toFixed(2)}`;
  }
}
