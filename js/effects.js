// Visual Effects (Screen Shake, Background Grid)
const Effects = {
    shakeTime: 0,
    shakeMagnitude: 0,
    
    // Background properties
    gridOffset: 0,
    gridSpeed: 20, // Pixels per second
    particles: [],

    init(width, height) {
        // Initialize background particles
        for(let i=0; i<50; i++) {
            this.particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2 + 1,
                speedY: Math.random() * -20 - 10,
                opacity: Math.random() * 0.5
            });
        }
    },

    shake(duration, magnitude) {
        this.shakeTime = duration;
        this.shakeMagnitude = magnitude;
    },

    update(dt, width, height) {
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
        }

        // Update background
        this.gridOffset += this.gridSpeed * dt;
        if (this.gridOffset > 50) {
            this.gridOffset -= 50;
        }

        // Update bg particles
        this.particles.forEach(p => {
            p.y += p.speedY * dt;
            if (p.y < 0) {
                p.y = height;
                p.x = Math.random() * width;
            }
        });
    },

    applyShake(ctx) {
        if (this.shakeTime > 0) {
            const dx = (Math.random() - 0.5) * this.shakeMagnitude;
            const dy = (Math.random() - 0.5) * this.shakeMagnitude;
            ctx.translate(dx, dy);
        }
    },

    drawBackground(ctx, width, height) {
        // Clear
        ctx.fillStyle = '#05050a';
        ctx.fillRect(0, 0, width, height);

        // Draw moving grid
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        // Vertical lines
        for (let x = 0; x < width; x += 50) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        // Horizontal lines
        for (let y = this.gridOffset - 50; y < height; y += 50) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Draw background particles
        this.particles.forEach(p => {
            ctx.fillStyle = `rgba(0, 243, 255, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw Arena Boundaries
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f3ff';
        ctx.strokeRect(5, 5, width - 10, height - 10);
        ctx.shadowBlur = 0; // Reset
    }
};
