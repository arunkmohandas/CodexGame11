export class CurrencySystem {
  constructor(state) {
    this.state = state;
  }

  add(amount) {
    this.state.energy += amount;
    this.state.stats.totalEnergy += amount;
  }

  spend(amount) {
    if (this.state.energy < amount) return false;
    this.state.energy -= amount;
    return true;
  }

  gainFromPuzzle(baseReward) {
    const mult = this.state.prestige.multiplier * (1 + this.state.upgrades.energyMult * 0.25);
    const reward = Math.round(baseReward * mult);
    this.add(reward);
    return reward;
  }

  get passivePerSecond() {
    return this.state.upgrades.offline * 0.12 + this.state.prestige.shards * 0.03;
  }
}
