// Environment and Static World Rendering
const Environment = {
    worldWidth: 2400,
    worldHeight: 1600,
    offscreenCanvas: null,
    offscreenCtx: null,
    walls: [], 
    props: [],
    coreNodes: [],
    
    zones: {
        ENTRY: { color: '#00f3ff', x: 0, y: 0, w: 800, h: 800 },
        CORRIDOR: { color: '#9d00ff', x: 800, y: 300, w: 800, h: 500 },
        CORE: { color: '#0077ff', x: 1600, y: 0, w: 800, h: 800 },
        CONTAINMENT: { color: '#ff00ff', x: 0, y: 800, w: 1200, h: 800 },
        BOSS: { color: '#ff3333', x: 1200, y: 800, w: 1200, h: 800 }
    },

    init() {
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.worldWidth;
        this.offscreenCanvas.height = this.worldHeight;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { alpha: false });
        
        this.generateWorld();
        this.renderStaticWorld();
    },

    generateWorld() {
        this.walls = [];
        this.props = [];
        
        // Add Outer Boundary Walls
        const t = 80; // Thickness
        this.walls.push({ type: 'wall', x: 0, y: 0, w: this.worldWidth, h: t }); // Top
        this.walls.push({ type: 'wall', x: 0, y: this.worldHeight - t, w: this.worldWidth, h: t }); // Bottom
        this.walls.push({ type: 'wall', x: 0, y: 0, w: t, h: this.worldHeight }); // Left
        this.walls.push({ type: 'wall', x: this.worldWidth - t, y: 0, w: t, h: this.worldHeight }); // Right

        // Internal Walls / Architecture
        this.walls.push({ type: 'wall', x: 800, y: 0, w: 40, h: 400 });
        this.walls.push({ type: 'wall', x: 800, y: 600, w: 40, h: 500 });
        this.walls.push({ type: 'wall', x: 1600, y: 0, w: 40, h: 300 });
        this.walls.push({ type: 'wall', x: 1600, y: 800, w: 40, h: 800 });
        
        // Containment / Boss divider
        this.walls.push({ type: 'wall', x: 1000, y: 800, w: 600, h: 40 });
        this.walls.push({ type: 'wall', x: 1200, y: 800, w: 40, h: 800 });
        
        // Populate Props (Crates, Terminals, Generators)
        // These are also added to walls for collision
        const addProp = (type, x, y, size) => {
            const prop = { type, x, y, w: size, h: size };
            this.walls.push(prop);
            this.props.push(prop);
        };

        // Industrial Room Crates
        addProp('crate', 200, 300, 80);
        addProp('crate', 290, 300, 80);
        addProp('crate', 200, 390, 80);
        
        addProp('crate', 950, 450, 80);
        addProp('crate', 950, 540, 80);

        // Security / Lab Terminals
        addProp('terminal', 600, 200, 80);
        addProp('terminal', 700, 200, 80);
        addProp('serverRack', 600, 100, 80); // Treat serverRack as 80x80 collision

        // Energy Core Generators
        addProp('generator', 1800, 200, 120);
        addProp('generator', 2000, 500, 120);
        addProp('generator', 1800, 600, 120);

        // Random crates
        for (let i = 0; i < 15; i++) {
            addProp('crate', Utils.randomInt(100, this.worldWidth - 150), Utils.randomInt(100, this.worldHeight - 150), 80);
        }
    },

    spawnCoreNodes() {
        this.coreNodes = [
            { x: 400, y: 400, active: true },
            { x: 2000, y: 400, active: true },
            { x: 1200, y: 1200, active: true }
        ];
    },

    interactWithNode(player) {
        if (!this.coreNodes) return false;
        for (const node of this.coreNodes) {
            if (node.active && Utils.distance(player.x, player.y, node.x, node.y) < 100) {
                node.active = false;
                Particles.spawn(node.x, node.y, 30, '#00f3ff', 2, 1.5);
                AudioSys.playTone(600, 'sine', 0.2, 0.2);
                return true;
            }
        }
        return false;
    },

    renderStaticWorld() {
        const ctx = this.offscreenCtx;
        const w = this.worldWidth;
        const h = this.worldHeight;
        
        // 1. Draw Floor Tile Pattern (Procedural Fallback)
        ctx.fillStyle = '#0a0b10';
        ctx.fillRect(0, 0, w, h);
        ctx.lineWidth = 1;
        const tileSize = 200;
        for (let x = 0; x < w; x += tileSize) {
            for (let y = 0; y < h; y += tileSize) {
                const val = 10 + Math.random() * 5;
                ctx.fillStyle = `rgb(${val}, ${val + 1}, ${val + 4})`;
                ctx.fillRect(x, y, tileSize, tileSize);
                ctx.strokeStyle = '#050508';
                ctx.strokeRect(x, y, tileSize, tileSize);
            }
        }

        // 2. Draw 3D Walls
        const wallsOnly = this.walls.filter(w => w.type === 'wall');
        
        // Wall Drop Shadows
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 30;
        ctx.shadowColor = 'rgba(0,0,0,1)';
        ctx.shadowOffsetY = 20;
        for (const wall of wallsOnly) {
            ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        }
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Draw Wall Geometry
        for (const wall of wallsOnly) {
            ctx.fillStyle = '#111317';
            ctx.fillRect(wall.x, wall.y, wall.w, wall.h + 20); 
            ctx.fillStyle = '#1c1e24';
            ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
            ctx.strokeStyle = '#2d303a';
            ctx.lineWidth = 2;
            ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
        }
        
        // 3. Draw Props
        for (const prop of this.props) {
            ctx.fillStyle = '#1c1e24';
            ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
            ctx.strokeStyle = '#2d303a';
            ctx.lineWidth = 2;
            ctx.strokeRect(prop.x, prop.y, prop.w, prop.h);
        }
        
        // 4. Subtle ambient lighting pass
        // Add a few baked light pools around generators or terminals
        ctx.globalCompositeOperation = 'lighter';
        for (const prop of this.props) {
            if (prop.type === 'generator') {
                const grad = ctx.createRadialGradient(prop.x+prop.w/2, prop.y+prop.h/2, 0, prop.x+prop.w/2, prop.y+prop.h/2, prop.w*2);
                grad.addColorStop(0, 'rgba(0, 229, 255, 0.15)');
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(prop.x+prop.w/2, prop.y+prop.h/2, prop.w*2, 0, Math.PI*2);
                ctx.fill();
            }
            if (prop.type === 'terminal') {
                const grad = ctx.createRadialGradient(prop.x+prop.w/2, prop.y+prop.h/2, 0, prop.x+prop.w/2, prop.y+prop.h/2, prop.w);
                grad.addColorStop(0, 'rgba(0, 229, 255, 0.1)');
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(prop.x+prop.w/2, prop.y+prop.h/2, prop.w, 0, Math.PI*2);
                ctx.fill();
            }
        }
        ctx.globalCompositeOperation = 'source-over';
    },

    draw(ctx, cameraX, cameraY, screenWidth, screenHeight) {
        ctx.drawImage(
            this.offscreenCanvas, 
            cameraX, cameraY, screenWidth, screenHeight,
            0, 0, screenWidth, screenHeight 
        );

        ctx.save();
        ctx.translate(-cameraX, -cameraY);
        for (const node of this.coreNodes || []) {
            if (node.active) {
                ctx.fillStyle = '#00f3ff';
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#00f3ff';
                ctx.beginPath();
                ctx.arc(node.x, node.y, 20 + Math.sin(Date.now() / 150) * 5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#fff';
                ctx.font = '14px monospace';
                ctx.textAlign = 'center';
                ctx.shadowBlur = 0;
                ctx.fillText('[E] ACTIVATE', node.x, node.y - 40);
            } else {
                ctx.fillStyle = '#111';
                ctx.strokeStyle = '#00f3ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
        ctx.restore();
    }
};
