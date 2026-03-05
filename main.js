import { GameManager } from './js/gameManager.js';

window.addEventListener('DOMContentLoaded', () => {
  const game = new GameManager();
  window.flowIdleGame = game;
});
