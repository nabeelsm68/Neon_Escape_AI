// Input Handling
const Input = {
    keys: {
        w: false,
        a: false,
        s: false,
        d: false,
        space: false,
        e: false,
        esc: false
    },
    mouse: {
        x: 0, // Screen X
        y: 0, // Screen Y
        left: false
    },
    
    // Scale factors in case canvas is resized via CSS but logical resolution is fixed
    scaleX: 1,
    scaleY: 1,

    init(canvas) {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w' || key === 'arrowup') this.keys.w = true;
            if (key === 'a' || key === 'arrowleft') this.keys.a = true;
            if (key === 's' || key === 'arrowdown') this.keys.s = true;
            if (key === 'd' || key === 'arrowright') this.keys.d = true;
            if (key === ' ') this.keys.space = true;
            if (key === 'e') this.keys.e = true;
            if (key === 'escape') this.keys.esc = true;
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w' || key === 'arrowup') this.keys.w = false;
            if (key === 'a' || key === 'arrowleft') this.keys.a = false;
            if (key === 's' || key === 'arrowdown') this.keys.s = false;
            if (key === 'd' || key === 'arrowright') this.keys.d = false;
            if (key === ' ') this.keys.space = false;
            if (key === 'e') this.keys.e = false;
            if (key === 'escape') {
                this.keys.esc = false;
                // Trigger pause toggle if game is running
                if (Game && (Game.state === Game.STATES.PLAYING || Game.state === Game.STATES.PAUSED)) {
                    Game.togglePause();
                }
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * this.scaleX;
            this.mouse.y = (e.clientY - rect.top) * this.scaleY;
        });

        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.left = true;
        });

        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.left = false;
        });

        // Prevent context menu on right click
        canvas.addEventListener('contextmenu', e => e.preventDefault());
    },

    updateScale(logicalWidth, logicalHeight, rectWidth, rectHeight) {
        this.scaleX = logicalWidth / rectWidth;
        this.scaleY = logicalHeight / rectHeight;
    }
};
