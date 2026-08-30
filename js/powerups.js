// Powerup System
const POWERUP_TYPES = {
    HEALTH: { color: '#33ff33', letter: 'H', chance: 0.5 },
    ENERGY: { color: '#0077ff', letter: 'E', chance: 0.3 },
    OVERDRIVE: { color: '#ff00ff', letter: 'O', chance: 0.2 },
    SHIELD: { color: '#ffff00', letter: 'S', chance: 0.1 }
};

class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 12;
        this.active = true;
        this.life = 10; // Disappears after 10 seconds
        this.maxLife = 10;
        this.pulse = 0;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
        }
        this.pulse += dt * 5;
    }

    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Float effect
        const floatY = Math.sin(this.pulse) * 5;
        ctx.translate(0, floatY);
        
        // Light pool
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 3);
        grad.addColorStop(0, `rgba(${this.hexToRgb(this.type.color)}, 0.2)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(this.pulse * 0.5);

        // Render capsule/crystal depending on type
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.type.color;
        ctx.fillStyle = '#111'; // Dark metallic base
        ctx.strokeStyle = this.type.color;
        ctx.lineWidth = 2;

        if (this.type === POWERUP_TYPES.HEALTH) {
            // Health: Cross/Capsule
            ctx.beginPath();
            ctx.roundRect(-this.radius, -this.radius*0.4, this.radius*2, this.radius*0.8, 5);
            ctx.fill();
            ctx.stroke();
            // Inner Cross
            ctx.fillStyle = this.type.color;
            ctx.fillRect(-this.radius*0.4, -this.radius*0.15, this.radius*0.8, this.radius*0.3);
            ctx.fillRect(-this.radius*0.15, -this.radius*0.4, this.radius*0.3, this.radius*0.8);
        } 
        else if (this.type === POWERUP_TYPES.ENERGY) {
            // Energy: Crystal/Diamond
            ctx.beginPath();
            ctx.moveTo(0, -this.radius);
            ctx.lineTo(this.radius*0.7, 0);
            ctx.lineTo(0, this.radius);
            ctx.lineTo(-this.radius*0.7, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Inner glow
            ctx.fillStyle = this.type.color;
            ctx.beginPath();
            ctx.moveTo(0, -this.radius*0.5);
            ctx.lineTo(this.radius*0.35, 0);
            ctx.lineTo(0, this.radius*0.5);
            ctx.lineTo(-this.radius*0.35, 0);
            ctx.closePath();
            ctx.fill();
        } 
        else if (this.type === POWERUP_TYPES.OVERDRIVE) {
            // Overdrive: Spiky core
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const r = i % 2 === 0 ? this.radius : this.radius * 0.4;
                const angle = (i * Math.PI) / 4;
                if (i===0) ctx.moveTo(r*Math.cos(angle), r*Math.sin(angle));
                else ctx.lineTo(r*Math.cos(angle), r*Math.sin(angle));
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = this.type.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        else if (this.type === POWERUP_TYPES.SHIELD) {
            // Shield: Hexagon
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                if (i===0) ctx.moveTo(this.radius*Math.cos(angle), this.radius*Math.sin(angle));
                else ctx.lineTo(this.radius*Math.cos(angle), this.radius*Math.sin(angle));
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = this.type.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Warning blink if about to expire (last 2 seconds)
        if (this.life < 2.0 && Math.floor(this.life * 10) % 2 === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
    
    hexToRgb(hex) {
        let r = 0, g = 0, b = 0;
        if (hex.length == 7) {
            r = parseInt(hex.substring(1,3), 16);
            g = parseInt(hex.substring(3,5), 16);
            b = parseInt(hex.substring(5,7), 16);
        }
        return `${r}, ${g}, ${b}`;
    }
}
