// Particle System
class Particle {
    constructor(x, y, vx, vy, life, color, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
        this.decay = 1; // life decay rate multiplier
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt * this.decay;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Motion blur stretch for particles
        ctx.translate(this.x, this.y);
        const speedSq = this.vx*this.vx + this.vy*this.vy;
        if (speedSq > 1000) {
            ctx.rotate(Math.atan2(this.vy, this.vx));
            ctx.scale(1 + Math.sqrt(speedSq)*0.005, 1);
        }
        
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15 * alpha;
        ctx.shadowColor = this.color;
        
        // Sparks (Lines) vs Orbs (Circles)
        if (this.size < 2 && speedSq > 5000) {
            ctx.beginPath();
            ctx.moveTo(-this.size*3, 0);
            ctx.lineTo(this.size*3, 0);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size;
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class DamageNumber {
    constructor(x, y, amount, isCrit) {
        this.x = x + (Math.random() - 0.5) * 20;
        this.y = y - 20;
        this.amount = amount;
        this.isCrit = isCrit;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.vy = -30;
    }

    update(dt) {
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = this.isCrit ? "bold 20px 'Rajdhani'" : "16px 'Rajdhani'";
        ctx.fillStyle = this.isCrit ? "#ff3333" : "#fff";
        if (this.isCrit) {
            ctx.shadowBlur = 5;
            ctx.shadowColor = "#ff0000";
        }
        ctx.fillText(this.isCrit ? `-${this.amount} CRIT!` : `-${this.amount}`, this.x, this.y);
        ctx.restore();
    }
}

const Particles = {
    list: [],
    texts: [],

    spawn(x, y, count, color, speedScale, lifeScale) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200 * speedScale + 50;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const life = (Math.random() * 0.5 + 0.2) * lifeScale;
            const size = Math.random() * 3 + 1;
            this.list.push(new Particle(x, y, vx, vy, life, color, size));
        }
    },
    
    spawnDirectional(x, y, count, color, angle, spread, speedScale, lifeScale) {
        for (let i = 0; i < count; i++) {
            const finalAngle = angle + (Math.random() - 0.5) * spread;
            const speed = Math.random() * 200 * speedScale + 50;
            const vx = Math.cos(finalAngle) * speed;
            const vy = Math.sin(finalAngle) * speed;
            const life = (Math.random() * 0.5 + 0.2) * lifeScale;
            const size = Math.random() * 3 + 1;
            this.list.push(new Particle(x, y, vx, vy, life, color, size));
        }
    },

    spawnDamageNumber(x, y, amount, isCrit = false) {
        this.texts.push(new DamageNumber(x, y, amount, isCrit));
    },

    update(dt) {
        // Update particles
        for (let i = this.list.length - 1; i >= 0; i--) {
            this.list[i].update(dt);
            if (this.list[i].life <= 0) {
                this.list.splice(i, 1);
            }
        }
        
        // Update text
        for (let i = this.texts.length - 1; i >= 0; i--) {
            this.texts[i].update(dt);
            if (this.texts[i].life <= 0) {
                this.texts.splice(i, 1);
            }
        }
    },

    draw(ctx) {
        this.list.forEach(p => p.draw(ctx));
        this.texts.forEach(t => t.draw(ctx));
    },
    
    clear() {
        this.list = [];
        this.texts = [];
    }
};
