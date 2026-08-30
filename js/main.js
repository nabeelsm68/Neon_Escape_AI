// Main Entry Point and Setup
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Logical resolution (internal game size)
    const LOGICAL_WIDTH = 1280;
    const LOGICAL_HEIGHT = 720;

    canvas.width = LOGICAL_WIDTH;
    canvas.height = LOGICAL_HEIGHT;

    // Responsive scaling
    function resize() {
        const windowRatio = window.innerWidth / window.innerHeight;
        const logicalRatio = LOGICAL_WIDTH / LOGICAL_HEIGHT;

        let renderWidth, renderHeight;

        if (windowRatio < logicalRatio) {
            // Fit to width
            renderWidth = window.innerWidth;
            renderHeight = window.innerWidth / logicalRatio;
        } else {
            // Fit to height
            renderHeight = window.innerHeight;
            renderWidth = window.innerHeight * logicalRatio;
        }

        canvas.style.width = `${renderWidth}px`;
        canvas.style.height = `${renderHeight}px`;

        Input.updateScale(LOGICAL_WIDTH, LOGICAL_HEIGHT, renderWidth, renderHeight);
    }

    window.addEventListener('resize', resize);
    resize();

    // Initialize systems
    Input.init(canvas);
    Game.init(canvas, ctx);

    // Game Loop
    let lastTime = performance.now();

    function loop(timestamp) {
        // Calculate Delta Time in seconds
        let dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        // Cap dt to prevent massive jumps on tab switch
        if (dt > 0.1) dt = 0.1;

        // Update
        Game.update(dt);

        // Render
        Game.draw();

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
});
