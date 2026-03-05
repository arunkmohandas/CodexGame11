export class GridSystem {
  constructor(container) {
    this.container = container;
    this.cells = [];
    this.size = 0;
  }

  build(size) {
    this.size = size;
    this.container.innerHTML = '';
    this.container.style.setProperty('--grid-size', size);
    this.cells = Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) => {
        const cell = document.createElement('button');
        cell.className = 'grid-cell';
        cell.dataset.x = x;
        cell.dataset.y = y;
        this.container.appendChild(cell);
        return cell;
      })
    );
  }

  getCell(x, y) {
    return this.cells?.[y]?.[x];
  }

  clearPaint() {
    this.cells.flat().forEach((cell) => {
      cell.style.removeProperty('--fill');
      cell.classList.remove('endpoint', 'filled', 'hinted', 'blocked');
      cell.innerHTML = '';
    });
  }

  paintCell(x, y, color, endpoint = false) {
    const cell = this.getCell(x, y);
    if (!cell) return;
    cell.style.setProperty('--fill', color);
    cell.classList.add(endpoint ? 'endpoint' : 'filled');
    if (endpoint) {
      cell.innerHTML = '<span class="dot"></span>';
    }
  }

  hintCell(x, y) {
    const cell = this.getCell(x, y);
    if (!cell) return;
    cell.classList.add('hinted');
    setTimeout(() => cell.classList.remove('hinted'), 900);
  }
}
