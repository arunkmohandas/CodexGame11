const key = (x, y) => `${x},${y}`;

export class PathDrawingSystem {
  constructor(puzzle) {
    this.puzzle = puzzle;
    this.size = puzzle.size;
    this.occupancy = Array.from({ length: this.size }, () => Array(this.size).fill(null));
    this.paths = {};
    this.history = [];
    Object.entries(puzzle.endpoints).forEach(([colorId, points]) => {
      this.paths[colorId] = [points[0]];
      points.forEach(({ x, y }) => {
        this.occupancy[y][x] = colorId;
      });
    });
    this.rebuildFromPaths();
  }

  clonePaths() {
    return JSON.parse(JSON.stringify(this.paths));
  }

  pushHistory() {
    this.history.push(this.clonePaths());
    if (this.history.length > 40) this.history.shift();
  }

  undo() {
    const prev = this.history.pop();
    if (!prev) return false;
    this.paths = prev;
    this.rebuildFromPaths();
    return true;
  }

  reset() {
    this.history = [];
    Object.entries(this.puzzle.endpoints).forEach(([colorId, points]) => {
      this.paths[colorId] = [points[0]];
    });
    this.rebuildFromPaths();
  }

  rebuildFromPaths() {
    this.occupancy = Array.from({ length: this.size }, () => Array(this.size).fill(null));
    Object.entries(this.puzzle.endpoints).forEach(([colorId, points]) => {
      points.forEach(({ x, y }) => {
        this.occupancy[y][x] = colorId;
      });
    });
    Object.entries(this.paths).forEach(([colorId, cells]) => {
      cells.forEach(({ x, y }) => {
        this.occupancy[y][x] = colorId;
      });
    });
  }

  startPath(colorId, start) {
    this.pushHistory();
    const fixed = new Set(this.puzzle.endpoints[colorId].map((p) => key(p.x, p.y)));
    const startKey = key(start.x, start.y);
    this.paths[colorId] = [start];
    this.occupancy.forEach((row, y) => row.forEach((_, x) => {
      if (this.occupancy[y][x] === colorId && !fixed.has(key(x, y))) this.occupancy[y][x] = null;
    }));
    this.occupancy[start.y][start.x] = colorId;
    if (!fixed.has(startKey)) this.paths[colorId] = [start];
  }

  canStep(colorId, to) {
    if (to.x < 0 || to.y < 0 || to.x >= this.size || to.y >= this.size) return false;
    const occ = this.occupancy[to.y][to.x];
    if (!occ) return true;
    if (occ === colorId) return true;
    return false;
  }

  step(colorId, to) {
    const path = this.paths[colorId];
    const last = path[path.length - 1];
    if (Math.abs(last.x - to.x) + Math.abs(last.y - to.y) !== 1) return false;
    if (!this.canStep(colorId, to)) return false;

    if (path.length > 1) {
      const prev = path[path.length - 2];
      if (prev.x === to.x && prev.y === to.y) {
        const removed = path.pop();
        const isEndpoint = this.puzzle.endpoints[colorId].some((p) => p.x === removed.x && p.y === removed.y);
        if (!isEndpoint) this.occupancy[removed.y][removed.x] = null;
        return true;
      }
    }

    const occ = this.occupancy[to.y][to.x];
    if (occ && occ === colorId) {
      const isExistingInPath = path.some((p) => p.x === to.x && p.y === to.y);
      if (isExistingInPath) return false;
    }

    path.push(to);
    this.occupancy[to.y][to.x] = colorId;
    return true;
  }

  isColorConnected(colorId) {
    const ends = this.puzzle.endpoints[colorId];
    const path = this.paths[colorId];
    const tail = path[path.length - 1];
    return (tail.x === ends[1].x && tail.y === ends[1].y) || (tail.x === ends[0].x && tail.y === ends[0].y && path.length > 1);
  }

  isSolved() {
    const allConnected = Object.keys(this.puzzle.endpoints).every((c) => this.isColorConnected(c));
    if (!allConnected) return false;
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        if (!this.occupancy[y][x]) return false;
      }
    }
    return true;
  }

  filledCount() {
    return this.occupancy.flat().filter(Boolean).length;
  }
}
