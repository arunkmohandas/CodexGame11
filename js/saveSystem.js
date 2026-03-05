import { SAVE_KEY } from './config.js';

export class SaveSystem {
  static load(defaultState) {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return structuredClone(defaultState);
      const parsed = JSON.parse(raw);
      return SaveSystem.merge(defaultState, parsed);
    } catch {
      return structuredClone(defaultState);
    }
  }

  static save(state) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  static merge(base, incoming) {
    if (Array.isArray(base)) {
      return Array.isArray(incoming) ? incoming : base;
    }
    if (typeof base === 'object' && base !== null) {
      const out = { ...base };
      Object.keys(base).forEach((key) => {
        out[key] = SaveSystem.merge(base[key], incoming?.[key]);
      });
      return out;
    }
    return incoming ?? base;
  }
}
