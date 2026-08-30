// Math and Helper Utilities
const Utils = {
    // Generate a random float between min and max
    random: (min, max) => Math.random() * (max - min) + min,

    // Generate a random integer between min and max (inclusive)
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

    // Calculate distance between two points
    distance: (x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // Calculate angle between two points in radians
    angle: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),

    // Clamp a value between min and max
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),

    // Linear interpolation
    lerp: (start, end, amt) => (1 - amt) * start + amt * end,

    formatTime: (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
};

const Pathfinder = {
    cellSize: 40,
    grid: [],
    cols: 0,
    rows: 0,

    init(worldWidth, worldHeight, walls) {
        this.cols = Math.ceil(worldWidth / this.cellSize);
        this.rows = Math.ceil(worldHeight / this.cellSize);
        this.grid = new Array(this.rows).fill(0).map(() => new Array(this.cols).fill(true));

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cellX = x * this.cellSize;
                const cellY = y * this.cellSize;
                
                for (const wall of walls) {
                    if (cellX < wall.x + wall.w && cellX + this.cellSize > wall.x &&
                        cellY < wall.y + wall.h && cellY + this.cellSize > wall.y) {
                        this.grid[y][x] = false;
                        break;
                    }
                }
            }
        }
    },

    findPath(startX, startY, endX, endY) {
        const startC = Math.floor(Utils.clamp(startX / this.cellSize, 0, this.cols - 1));
        const startR = Math.floor(Utils.clamp(startY / this.cellSize, 0, this.rows - 1));
        const endC = Math.floor(Utils.clamp(endX / this.cellSize, 0, this.cols - 1));
        const endR = Math.floor(Utils.clamp(endY / this.cellSize, 0, this.rows - 1));

        if (!this.grid[endR] || !this.grid[endR][endC]) {
            // Target is in a wall, just move directly (or find nearest, but fallback to direct is fine)
            return null;
        }

        const openSet = [];
        const closedSet = new Set();
        
        const startNode = { c: startC, r: startR, g: 0, h: 0, f: 0, parent: null };
        openSet.push(startNode);
        
        const openMap = new Map();
        openMap.set(`${startC},${startR}`, startNode);

        const getNeighbors = (node) => {
            const neighbors = [];
            const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]];
            for (const [dc, dr] of dirs) {
                const nc = node.c + dc;
                const nr = node.r + dr;
                if (nc >= 0 && nc < this.cols && nr >= 0 && nr < this.rows && this.grid[nr][nc]) {
                    // Prevent corner cutting
                    if (Math.abs(dc) === 1 && Math.abs(dr) === 1) {
                        if (!this.grid[node.r][nc] || !this.grid[nr][node.c]) continue;
                    }
                    neighbors.push({ c: nc, r: nr });
                }
            }
            return neighbors;
        };

        const heuristic = (c1, r1, c2, r2) => {
            const dc = Math.abs(c1 - c2);
            const dr = Math.abs(r1 - r2);
            return dc + dr + (Math.sqrt(2) - 2) * Math.min(dc, dr);
        };

        let iterations = 0;
        const MAX_ITERATIONS = 500; // Prevent infinite loops or massive lag

        while (openSet.length > 0) {
            iterations++;
            if (iterations > MAX_ITERATIONS) return null;

            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            const currentKey = `${current.c},${current.r}`;
            openMap.delete(currentKey);

            if (current.c === endC && current.r === endR) {
                const path = [];
                let curr = current;
                while (curr) {
                    path.push({
                        x: curr.c * this.cellSize + this.cellSize / 2,
                        y: curr.r * this.cellSize + this.cellSize / 2
                    });
                    curr = curr.parent;
                }
                return path.reverse();
            }

            closedSet.add(currentKey);

            const neighbors = getNeighbors(current);
            for (const neighbor of neighbors) {
                const nKey = `${neighbor.c},${neighbor.r}`;
                if (closedSet.has(nKey)) continue;

                const cost = (Math.abs(neighbor.c - current.c) + Math.abs(neighbor.r - current.r) === 2) ? Math.SQRT2 : 1;
                const tentativeG = current.g + cost;

                let neighborNode = openMap.get(nKey);
                if (!neighborNode) {
                    neighborNode = { c: neighbor.c, r: neighbor.r, g: tentativeG, parent: current };
                    neighborNode.h = heuristic(neighbor.c, neighbor.r, endC, endR);
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    openSet.push(neighborNode);
                    openMap.set(nKey, neighborNode);
                } else if (tentativeG < neighborNode.g) {
                    neighborNode.g = tentativeG;
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    neighborNode.parent = current;
                }
            }
        }
        return null;
    }
};
