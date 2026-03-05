import { UPGRADE_DEFS } from './config.js';

export class UpgradeSystem {
  constructor(state, currency) {
    this.state = state;
    this.currency = currency;
  }

  cost(id) {
    const def = UPGRADE_DEFS[id];
    const level = this.state.upgrades[id];
    return Math.round(def.baseCost * (def.growth ** level));
  }

  canBuy(id) {
    return this.state.energy >= this.cost(id);
  }

  buy(id) {
    const cost = this.cost(id);
    if (!this.currency.spend(cost)) return false;
    this.state.upgrades[id] += 1;
    this.state.stats.upgradesPurchased += 1;
    return true;
  }

  resetForPrestige() {
    Object.keys(this.state.upgrades).forEach((key) => {
      this.state.upgrades[key] = 0;
    });
  }
}
